# Parameters & setup 
input_file      <- "data/resources/mc1-report-data.csv"
output_dir      <- "app/public/data/resources/Q3-"
bin_width_hours <- 6

# Attributes to include in summaries:
attrs    <- c("buildings",
              "medical",
              "roads_and_bridges",
              "power",
              "sewer_and_water")
shake_col <- "shake_intensity"

# Ensure output directory exists
dir.create(output_dir, recursive = TRUE, showWarnings = FALSE)


# Load & preprocess
df <- read.csv(input_file, stringsAsFactors = FALSE)

# Convert timestamps & compute relative time (hours since first report)
df$timestamp <- as.POSIXct(df$time,
                           format = "%Y-%m-%d %H:%M:%S",
                           tz     = "Europe/London")
t0 <- min(df$timestamp, na.rm = TRUE)
df$t_rel_hours <- as.numeric(difftime(df$timestamp,
                                      t0,
                                      units = "hours"))

# Bin into regular windows
df$bin_id         <- floor(df$t_rel_hours / bin_width_hours)
df$bin_start_rel  <- df$bin_id * bin_width_hours
df$bin_timestamp  <- t0 + df$bin_start_rel * 3600


# Normalize all damage attributes to [0,1]
for (j in attrs) {
  if (! j %in% names(df)) {
    stop("Missing attribute column: ", j)
  }
  df[[ paste0(j, "_norm") ]] <- df[[j]] / 10
}
df$shake_intensity_norm <- df[[shake_col]] / 10


# Location-level summaries
# We'll build a long table: one row per (location, bin, attribute)

# Split by location+bin
grp <- split(df, list(df$location, df$bin_id), drop = TRUE)

loc_summary <- do.call(rbind, lapply(grp, function(sub) {
  loc       <- sub$location[1]
  bin_rel   <- sub$bin_start_rel[1]
  bin_time  <- sub$bin_timestamp[1]
  n_total   <- nrow(sub)
  
  # For each attribute, compute n, mean, sd, se
  do.call(rbind, lapply(c(attrs, shake_col), function(col) {
    col_norm <- if (col == shake_col) "shake_intensity_norm" else paste0(col, "_norm")
    x        <- sub[[col_norm]]
    n_j      <- sum(!is.na(x))
    mn       <- if (n_j>0) mean(x, na.rm=TRUE) else NA_real_
    sd_j     <- if (n_j>1) sd(x, na.rm=TRUE)   else NA_real_
    se_j     <- if (n_j>1) sd_j / sqrt(n_j)    else NA_real_
    
    data.frame(
      location       = loc,
      bin_start_rel  = bin_rel,
      bin_timestamp  = bin_time,
      attribute      = col,
      n_reports      = n_j,
      mean_norm      = mn,
      sd_norm        = sd_j,
      se_norm        = se_j,
      total_reports  = n_total,
      stringsAsFactors = FALSE
    )
  }))
}))

# Write location-level summary
write.csv(
  loc_summary,
  file = file.path(output_dir, "location_summary.csv"),
  row.names = FALSE
)


# Island-level summaries -------------------------------------
# Compute weighting schemes

# Equal weights
locations     <- sort(unique(df$location))
w_equal       <- rep(1/length(locations), length(locations))
names(w_equal) <- locations

# Intensity‐based weights (baseline = mean shake per location)
baseline_shake <- tapply(df$shake_intensity_norm,
                         df$location,
                         mean,
                         na.rm = TRUE)
# handle any all-NA
baseline_shake[ is.na(baseline_shake) ] <- 0
w_intensity    <- baseline_shake / sum(baseline_shake)
# In case all-zero, fall back to equal
if (sum(w_intensity)==0) w_intensity <- w_equal

# Build island summary: one row per (bin, attribute, scheme)
bins <- sort(unique(loc_summary$bin_start_rel))
schemes <- list(
  equal     = w_equal,
  intensity = w_intensity
)

island_summary <- do.call(rbind, lapply(bins, function(bin_rel) {
  bin_time <- t0 + bin_rel*3600
  sub      <- loc_summary[loc_summary$bin_start_rel == bin_rel, ]
  
  do.call(rbind, lapply(names(schemes), function(sch) {
    w_raw <- schemes[[sch]]
    
    # For each attribute
    do.call(rbind, lapply(unique(sub$attribute), function(attr) {
      sub_attr <- sub[sub$attribute == attr, ]
      valid    <- !is.na(sub_attr$mean_norm)
      if (!any(valid)) {
        mean_i <- NA_real_
        se_i   <- NA_real_
      } else {
        locs_valid    <- sub_attr$location[valid]
        w_valid       <- w_raw[locs_valid]
        w_adj         <- w_valid / sum(w_valid)
        mean_i        <- sum(w_adj * sub_attr$mean_norm[valid])
        se_i          <- sqrt( sum( (w_adj^2) * (sub_attr$se_norm[valid]^2) ) )
      }
      data.frame(
        bin_start_rel = bin_rel,
        bin_timestamp = bin_time,
        scheme        = sch,
        attribute     = attr,
        mean_norm     = mean_i,
        se_norm       = se_i,
        stringsAsFactors = FALSE
      )
    }))
  }))
}))

write.csv(
  island_summary,
  file = file.path(output_dir, "island_summary.csv"),
  row.names = FALSE
)


# Composite index & uncertainty
# Equal alpha weights across all attributes (excluding shake_intensity if desired)
core_attrs <- attrs  # or include shake_col as well
alpha <- rep(1/length(core_attrs), length(core_attrs))
names(alpha) <- core_attrs

comp_list <- do.call(rbind, lapply(split(island_summary, island_summary$scheme), function(sub) {
  sub <- sub[sub$attribute %in% core_attrs, ]
  # For each bin in this scheme
  do.call(rbind, lapply(unique(sub$bin_start_rel), function(bin_rel) {
    sbin <- sub[sub$bin_start_rel == bin_rel, ]
    # align order
    sbin <- sbin[match(core_attrs, sbin$attribute), ]
    means <- sbin$mean_norm
    ses   <- sbin$se_norm
    # Handle missing
    valid <- !is.na(means)
    a     <- alpha[valid]
    m     <- means[valid]
    s     <- ses[valid]
    a_adj <- a / sum(a)
    I     <- sum(a_adj * m)
    SE_I  <- sqrt(sum((a_adj^2) * (s^2)))
    
    data.frame(
      bin_start_rel    = bin_rel,
      bin_timestamp    = t0 + bin_rel*3600,
      scheme           = sub$scheme[1],
      composite_mean   = I,
      composite_se     = SE_I,
      stringsAsFactors = FALSE
    )
  }))
}))

write.csv(
  comp_list,
  file = file.path(output_dir, "composite_index.csv"),
  row.names = FALSE
)

# Change metrics (deltas & significance)
change_list <- do.call(rbind, lapply(split(comp_list, comp_list$scheme), function(sub) {
  sub <- sub[order(sub$bin_start_rel), ]
  n  <- nrow(sub)
  if (n < 2) return(NULL)
  
  # Compute delta, SE of delta, and significance
  delta       <- c(NA, diff(sub$composite_mean))
  se_delta    <- c(NA,
                   sqrt(sub$composite_se[-1]^2 +
                        sub$composite_se[-n]^2))
  signif      <- abs(delta) > 1.96 * se_delta
  
  data.frame(
    bin_start_rel    = sub$bin_start_rel,
    bin_timestamp    = sub$bin_timestamp,
    scheme           = sub$scheme,
    composite_mean   = sub$composite_mean,
    delta            = delta,
    se_delta         = se_delta,
    significant      = signif,
    stringsAsFactors = FALSE
  )
}))

write.csv(
  change_list,
  file = file.path(output_dir, "change_metrics.csv"),
  row.names = FALSE
)


# Coverage heatmap data
# Number of reports per (location, bin)
coverage <- aggregate(
  total_reports ~ location + bin_start_rel + bin_timestamp,
  data = loc_summary,
  FUN  = function(x) unique(x)
)

write.csv(
  coverage,
  file = file.path(output_dir, "coverage.csv"),
  row.names = FALSE
)
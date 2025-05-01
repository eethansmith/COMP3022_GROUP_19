### 1. Load data ####################################################
df <- read.csv(
  "data/resources/mc1-report-data-hourly-rounded.csv",
  stringsAsFactors = FALSE
)

### 2. Define weights ###############################################
w <- c(
  buildings          = 0.70,
  medical            = 0.10,
  roads_and_bridges  = 0.05,
  power              = 0.05,
  shake_intensity    = 0.10
)
key_cols <- names(w)

### 3. Per-report severity ##########################################
row_weighted_mean <- function(x, w_vec) {
  good <- !is.na(x)
  if (!any(good)) return(NA_real_)
  sum(x[good] * w_vec[good]) / sum(w_vec[good])
}

# Make sure all expected columns exist
missing_cols <- setdiff(key_cols, names(df))
if (length(missing_cols)) {
  stop("Data are missing required columns: ",
       paste(missing_cols, collapse = ", "))
}

df$severity <- apply(
  df[ key_cols ],
  1,
  row_weighted_mean,
  w_vec = w
)

### 4. Aggregate by location ########################################
agg_mat <- aggregate(
  severity ~ location,
  data = df,
  FUN  = function(x) c(
    n   = length(x),
    mn  = mean(x, na.rm = TRUE),
    sd  = sd(x,   na.rm = TRUE)
  )
)

# aggregate() packs the stats into a matrix column → unpack:
loc_stats <- data.frame(
  location = agg_mat$location,
  n        = agg_mat$severity[ , "n" ],
  mean_sev = agg_mat$severity[ , "mn"],
  sd_sev   = agg_mat$severity[ , "sd"],
  row.names = NULL
)

### 5. Empirical-Bayes shrinkage ####################################
mu_global <- mean(df$severity, na.rm = TRUE)
m         <- median(loc_stats$n)        # smoothing constant

loc_stats$adjusted <- (loc_stats$n / (loc_stats$n + m)) * loc_stats$mean_sev +
                      (m           / (loc_stats$n + m)) * mu_global

# OPTIONAL: conservative lower-CI alternative
loc_stats$lower_CI <- loc_stats$mean_sev -
                      1.96 * loc_stats$sd_sev / sqrt(loc_stats$n)

### 6. Rescale to 0-to-10 rating ####################################
min_adj <- min(loc_stats$adjusted)
max_adj <- max(loc_stats$adjusted)

loc_stats$rating <- 10 * (loc_stats$adjusted - min_adj) /
                          (max_adj - min_adj)
loc_stats$rating <- round(loc_stats$rating, 2)

### 7. Sort and export ##############################################
loc_stats <- loc_stats[ order(-loc_stats$rating), ]

write.csv(
  loc_stats,
  "app/public/data/resources/rescue-service-priority.csv",
  row.names = FALSE
)

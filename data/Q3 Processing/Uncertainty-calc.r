####################################################################
# prepare_dashboard_data.R
#
# Base-R pipeline to clean & roll up earthquake reports for:
#  • island-series.csv        – island composite & uncertainties
#  • location-time-matrix.csv – per-location composite + uncertainties
#  • changepoints.csv         – detected shifts in composite
#
# Input:  data/resources/mc1-report-data.csv
# Output: app/public/data/resources/
# Author: refactored dashboard-prep • May 2025
####################################################################

### 0. Configuration ------------------------------------------------
RAW_FILE         <- "data/resources/mc1-report-data.csv"
OUT_DIR          <- "app/public/data/resources/Q3"
BIN_SIZE_HOURS   <- 1            # hours per time bin
BIN_SIZE_S       <- BIN_SIZE_HOURS * 3600
ATTRIBUTES       <- c(
  "buildings",
  "medical",
  "roads_and_bridges",
  "power",
  "sewer_and_water"
)
SHAKE_COL        <- "shake_intensity"

# -- attribute weights (will be normalized to sum=1) --
raw_attr_weights <- c(
  buildings         = 1,
  medical           = 1,
  roads_and_bridges = 1,
  power             = 1,
  sewer_and_water   = 1,
  shake_intensity   = 1
)
WEIGHTS_ATTRS <- raw_attr_weights / sum(raw_attr_weights)

# -- change-point parameters --
CP_K    <- 5    # runmed window (odd integer ≥3)
CP_MULT <- 3    # threshold = CP_MULT × MAD of diffs

dir.create(OUT_DIR, recursive = TRUE, showWarnings = FALSE)


### 1. Helpers ------------------------------------------------------
# floor POSIXct to step seconds
bin_floor <- function(t, step) {
  as.POSIXct(floor(as.numeric(t) / step) * step,
             origin = "1970-01-01", tz = "Europe/London")
}

# weighted mean of a numeric vector x with weight w (base-R)
row_wmean <- function(x, w) {
  ok <- !is.na(x)
  if (!any(ok)) return(NA_real_)
  sum(x[ok] * w[ok]) / sum(w[ok])
}

# detect change-points in a numeric vector 'series'
detect_cpts <- function(time_bins, series, k = 5, mult = 3) {
  if (length(series) < k) {
    return(data.frame(
      time_bin         = as.POSIXct(character()),
      composite_before = numeric(),
      composite_after  = numeric(),
      delta            = numeric(),
      direction        = character(),
      stringsAsFactors = FALSE
    ))
  }
  smooth <- stats::runmed(series, k = k, endrule = "median")
  diffs  <- diff(smooth)
  mad_d  <- stats::median(abs(diffs - stats::median(diffs, na.rm=TRUE)),
                          na.rm = TRUE)
  thr    <- mult * mad_d
  idx    <- which(abs(diffs) > thr) + 1
  if (!length(idx)) {
    return(data.frame(
      time_bin         = as.POSIXct(character()),
      composite_before = numeric(),
      composite_after  = numeric(),
      delta            = numeric(),
      direction        = character(),
      stringsAsFactors = FALSE
    ))
  }
  data.frame(
    time_bin         = time_bins[idx],
    composite_before = series[idx - 1],
    composite_after  = series[idx],
    delta            = series[idx] - series[idx - 1],
    direction        = ifelse(series[idx] > series[idx - 1], "up", "down"),
    stringsAsFactors = FALSE
  )
}


### 2. Load & preprocess -------------------------------------------
df <- read.csv(RAW_FILE, stringsAsFactors = FALSE)

# parse time (assume Europe/London)
df$timestamp <- as.POSIXct(df$time,
                           format = if (grepl("T", df$time[1], fixed=TRUE))
                                      "%Y-%m-%dT%H:%M:%OS"
                                    else
                                      "%Y-%m-%d %H:%M:%OS",
                           tz = "Europe/London")

# bin into regular intervals
df$time_bin <- bin_floor(df$timestamp, BIN_SIZE_S)

# relative hours since first report (if needed downstream)
t0 <- min(df$timestamp, na.rm = TRUE)
df$t_rel_hours <- as.numeric(difftime(df$timestamp, t0, units = "hours"))

# normalize attributes to [0,1]
for (col in c(ATTRIBUTES, SHAKE_COL)) {
  if (! col %in% names(df)) {
    stop("Missing expected column: ", col)
  }
  df[[paste0(col, "_norm")]] <- df[[col]] / 10
}

# compute per-report composite severity & missing-cell count
attr_cols       <- intersect(names(df), ATTRIBUTES)
shake_norm_col  <- "shake_intensity_norm"
all_cols_norm   <- c(attr_cols, shake_norm_col)
w_vec           <- WEIGHTS_ATTRS[all_cols_norm]
df$severity     <- apply(df[ all_cols_norm ], 1, row_wmean, w = w_vec)
df$miss_cnt     <- apply(is.na(df[ all_cols_norm ]), 1, sum)


### 3. Per-(location,time) summaries -------------------------------
A <- length(all_cols_norm)

# 3a: group-level counts & means via aggregate()
agg_n   <- aggregate(severity ~ location + time_bin, df, length)
agg_mean<- aggregate(severity ~ location + time_bin, df, mean, na.rm = TRUE)
agg_sd  <- aggregate(severity ~ location + time_bin, df, sd,   na.rm = TRUE)
agg_miss<- aggregate(miss_cnt ~ location + time_bin, df, sum)

loc_time_df <- Reduce(function(x, y) merge(x, y,
                             by = c("location","time_bin"), all=TRUE),
                      list(agg_n, agg_mean, agg_sd, agg_miss))
names(loc_time_df) <- c("location","time_bin",
                        "n_reports","composite_severity",
                        "severity_sd","miss_cells")

# 3b: sampling uncertainty (SE) and normalize it to [0,1]
loc_time_df$SE <- loc_time_df$severity_sd / sqrt(loc_time_df$n_reports)
min_se <- min(loc_time_df$SE, na.rm = TRUE)
max_se <- max(loc_time_df$SE, na.rm = TRUE)
loc_time_df$sampling_uncertainty_norm <-
  (loc_time_df$SE - min_se) / (max_se - min_se)

# 3c: coverage uncertainty = missing cells / possible cells
loc_time_df$missing_rate <-
  loc_time_df$miss_cells / (loc_time_df$n_reports * A)

# 3d: combined local uncertainty
loc_time_df$local_uncertainty <-
  loc_time_df$sampling_uncertainty_norm + loc_time_df$missing_rate


### 4. Island-level roll-up -----------------------------------------
# baseline shake per location for intensity weighting
baseline_shake <- tapply(df$shake_intensity_norm,
                         df$location, mean, na.rm = TRUE)
baseline_shake[ is.na(baseline_shake) ] <- 0

# define weighting schemes
schemes <- list(
  equal    = function(sub) rep(1, nrow(sub)),
  sqrt_n   = function(sub) sqrt(sub$n_reports),
  intensity= function(sub) baseline_shake[ as.character(sub$location) ]
)

# for each scheme, compute weighted means by time_bin
time_bins <- sort(unique(loc_time_df$time_bin))
island_list <- lapply(names(schemes), function(sch) {
  sub   <- loc_time_df
  w_raw <- schemes[[sch]](sub)
  denom <- tapply(w_raw, sub$time_bin, sum, na.rm = TRUE)
  wmean_by_bin <- function(v) {
    num <- tapply(v * w_raw, sub$time_bin, sum, na.rm = TRUE)
    num / denom
  }
  data.frame(
    scheme              = sch,
    time_bin            = as.POSIXct(names(denom), tz = "Europe/London"),
    composite            = wmean_by_bin(sub$composite_severity),
    samp_uncertainty     = wmean_by_bin(sub$sampling_uncertainty_norm),
    cover_uncertainty    = wmean_by_bin(sub$missing_rate),
    combined_uncertainty = wmean_by_bin(sub$local_uncertainty),
    n_reports            = tapply(sub$n_reports, sub$time_bin, sum, na.rm = TRUE),
    row.names            = NULL,
    stringsAsFactors     = FALSE
  )
})
island_df <- do.call(rbind, island_list)
island_df <- island_df[ order(island_df$scheme, island_df$time_bin), ]


### 5. Change-point detection --------------------------------------
cp_list <- lapply(split(island_df, island_df$scheme), function(sub) {
  detect_cpts(sub$time_bin, sub$composite, k = CP_K, mult = CP_MULT)
})
names(cp_list) <- names(schemes)
cp_df <- do.call(rbind, lapply(names(cp_list), function(sch) {
  dfc <- cp_list[[sch]]
  if (nrow(dfc)) dfc$scheme <- sch
  dfc
}))
cp_df <- cp_df[, c("scheme","time_bin",
                   "composite_before","composite_after",
                   "delta","direction")]


### 6. Write outputs ------------------------------------------------
iso_time <- function(x) {
  format(x, "%Y-%m-%dT%H:%M:%SZ", tz = "UTC")
}

# 6a: island-series.csv
isl_out <- island_df
isl_out$time_bin <- iso_time(isl_out$time_bin)
write.csv(isl_out,
          file = file.path(OUT_DIR, "island-series.csv"),
          row.names = FALSE, quote = FALSE)

# 6b: location-time-matrix.csv
loc_out <- loc_time_df
loc_out$time_bin <- iso_time(loc_out$time_bin)
write.csv(loc_out,
          file = file.path(OUT_DIR, "location-time-matrix.csv"),
          row.names = FALSE, quote = FALSE)

# 6c: changepoints.csv
if (nrow(cp_df) == 0) {
  write.csv(cp_df,
            file = file.path(OUT_DIR, "changepoints.csv"),
            row.names = FALSE, quote = FALSE)
} else {
  cp_out <- cp_df
  cp_out$time_bin <- iso_time(cp_out$time_bin)
  write.csv(cp_out,
            file = file.path(OUT_DIR, "changepoints.csv"),
            row.names = FALSE, quote = FALSE)
}

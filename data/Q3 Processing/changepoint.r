####################################################################
# prepare_dashboard_data.R  — extract hourly changepoints
####################################################################

### 0. Configuration ----------------------------------------------
RAW_FILE         <- "data/resources/mc1-report-data.csv"
OUT_DIR          <- "app/public/data/resources/Q3"

BIN_SIZE_HOURS   <- 24          # <-- leave the existing daily binning
BIN_SIZE_S       <- BIN_SIZE_HOURS * 3600              # used by the
                                                       # other two outputs

## ✨ NEW — independent 1-hour bin size for changepoints ----------
CP_BIN_SIZE_HOURS <- 1
CP_BIN_SIZE_S     <- CP_BIN_SIZE_HOURS * 3600
####################################################################


### 5. Change-point detection  — **hourly buckets only for cp file** ----
# (Everything above here is identical to your current script.)
# -----------------------------------------------------------------
# 5a.  add a dedicated hourly bin
df$time_bin_cp <- bin_floor(df$timestamp, CP_BIN_SIZE_S)

# 5b.  per-(location, hour) composites (subset of the step-3 logic)
cp_n    <- aggregate(severity  ~ location + time_bin_cp, df, length)
cp_mean <- aggregate(severity  ~ location + time_bin_cp, df, mean, na.rm = TRUE)
cp_sd   <- aggregate(severity  ~ location + time_bin_cp, df, sd,   na.rm = TRUE)

loc_hr <- Reduce(
  function(x, y) merge(x, y, by = c("location", "time_bin_cp"), all = TRUE),
  list(cp_n, cp_mean, cp_sd)
)
names(loc_hr) <- c("location", "time_bin_cp",
                   "n_reports", "composite_severity", "severity_sd")

# 5c.  hourly island-level roll-up (mirrors step-4 weighting)
time_bins_cp <- sort(unique(loc_hr$time_bin_cp))
island_hr <- lapply(names(schemes), function(sch) {
  w_raw <- schemes[[sch]](loc_hr)
  denom <- tapply(w_raw, loc_hr$time_bin_cp, sum, na.rm = TRUE)
  wmean <- function(v)
    tapply(v * w_raw, loc_hr$time_bin_cp, sum, na.rm = TRUE) / denom

  data.frame(
    scheme    = sch,
    time_bin  = as.POSIXct(names(denom), tz = "Europe/London"),
    composite = wmean(loc_hr$composite_severity),
    row.names = NULL,
    stringsAsFactors = FALSE
  )
})
island_hr <- do.call(rbind, island_hr)
island_hr <- island_hr[order(island_hr$scheme, island_hr$time_bin), ]

# 5d.  detect shifts on the hourly series (unchanged algorithm)
cp_list <- lapply(split(island_hr, island_hr$scheme), function(sub)
  detect_cpts(sub$time_bin, sub$composite, k = CP_K, mult = CP_MULT))

cp_df <- do.call(rbind, mapply(function(sch, dfc) {
  if (nrow(dfc)) dfc$scheme <- sch
  dfc
}, names(cp_list), cp_list, SIMPLIFY = FALSE))

cp_df <- cp_df[ ,
  c("scheme", "time_bin",
    "composite_before", "composite_after",
    "delta", "direction") ]


### 6. Write outputs ----------------------------------------------
# 6a + 6b unchanged …

# 6c.  changepoints.csv  — now hourly -----------------------------
if (!nrow(cp_df)) {
  write.csv(cp_df, file = file.path(OUT_DIR, "changepoints.csv"),
            row.names = FALSE, quote = FALSE)
} else {
  cp_df$time_bin <- iso_time(cp_df$time_bin)  # ISO 8601 (UTC)
  write.csv(cp_df, file = file.path(OUT_DIR, "changepoints.csv"),
            row.names = FALSE, quote = FALSE)
}
####################################################################

#─── file paths ────────────────────────────────────────────────────────────────
RAW_FILE <- "data/resources/mc1-report-data.csv"
OUT_DIR  <- "app/public/data/resources/Q3/timeline-shake-intensity.csv"

#─── read and parse ────────────────────────────────────────────────────────────
# read, treating literal "NA" as missing
data <- read.csv(RAW_FILE, stringsAsFactors = FALSE, na.strings = "NA")

# parse the timestamp
data$timestamp <- as.POSIXct(
  data$time,
  format = "%Y-%m-%d %H:%M:%S",
  tz     = "UTC"
)

# bin into whole hours (e.g. "2020-04-08 17:00:00")
data$hour <- format(data$timestamp, "%Y-%m-%d %H:00:00")

# ensure shake_intensity is numeric (any non‐numeric or "NA" becomes NA)
data$shake_intensity <- as.numeric(data$shake_intensity)

#─── build full grid of hours × locations ─────────────────────────────────────
# 1) complete sequence of hours from first to last record
all_hours <- seq(
  from = min(data$timestamp, na.rm = TRUE),
  to   = max(data$timestamp, na.rm = TRUE),
  by   = "hour"
)
hour_bins <- format(all_hours, "%Y-%m-%d %H:00:00")

# 2) all unique locations
locations <- sort(unique(data$location))

# 3) cross‐join
full_grid <- expand.grid(
  location       = locations,
  hour           = hour_bins,
  stringsAsFactors = FALSE
)

#─── aggregate ────────────────────────────────────────────────────────────────
# function to get rounded mean, or NA if no valid values
mean_fun <- function(x) {
  if (all(is.na(x))) NA else round(mean(x, na.rm = TRUE))
}

agg <- aggregate(
  shake_intensity ~ location + hour,
  data = data,
  FUN  = mean_fun
)

# merge back onto full grid (missing combos stay NA)
result <- merge(
  full_grid,
  agg,
  by    = c("location", "hour"),
  all.x = TRUE
)

# sort by time then location
result <- result[order(result$hour, result$location), ]

# rename hour → time if desired
names(result) <- c("location", "time", "shake_intensity")

#─── write out ────────────────────────────────────────────────────────────────
write.csv(
  result,
  file      = OUT_DIR,
  row.names = FALSE,
  na        = "NA"
)

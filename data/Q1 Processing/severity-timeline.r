# Parameters
infile   <- "data/resources/mc1-report-data.csv"     
outfile  <- "app/public/data/resources/rescue-service-timeline.csv"
tz_data  <- "UTC"

# Load
raw <- read.csv(infile, stringsAsFactors = FALSE)

# Unify datetime
raw$datetime <- as.POSIXct(
  paste(raw$date, raw$timestamp),
  tz = tz_data
)

# Keeping only needed columns
w <- c(                    
  buildings          = 0.70,
  medical            = 0.10,
  roads_and_bridges  = 0.05,
  power              = 0.05,
  shake_intensity    = 0.10
)
key_cols <- names(w)

needed <- c("location", "datetime", key_cols)
missing_cols <- setdiff(needed, names(raw))
if (length(missing_cols))
  stop("Input is missing columns: ", paste(missing_cols, collapse = ", "))

data <- raw[ , needed ]  

# Simple median imputation per area-day
data$day <- as.Date(data$datetime, tz = tz_data)

for (col in key_cols) {
  med_tbl    <- tapply(data[[col]],
                       list(data$area, as.character(data$day)),
                       function(x) median(x, na.rm = TRUE))
  global_med <- median(data[[col]], na.rm = TRUE)

  for (i in seq_len(nrow(data))) {
    if (is.na(data[[col]][i])) {
      m <- med_tbl[data$area[i], as.character(data$day[i])]
      if (is.na(m)) m <- global_med
      data[[col]][i] <- m
    }
  }
}

# Per-report severity (weighted mean)
row_weighted_mean <- function(x, w_vec) {
  good <- !is.na(x)
  if (!any(good)) return(NA_real_)
  sum(x[good] * w_vec[good]) / sum(w_vec[good])
}

data$severity <- apply(
  data[ key_cols ],
  1,
  row_weighted_mean,
  w_vec = w
)

# Bucket Timestamps to 3-hour slots
bucket_seconds <- 3 * 3600
data$bucket <- as.POSIXct(
  floor(as.numeric(data$datetime) / bucket_seconds) * bucket_seconds,
  origin = "1970-01-01", tz = tz_data
)

# Mean & Count per area-slot 
agg <- aggregate(
  list(severity = data$severity, n = rep(1, nrow(data))),
  by   = list(area = data$area, datetime = data$bucket),
  FUN  = function(x) if (identical(x, rep(1, length(x)))) length(x) else mean(x)
)

# Full grid of area × time
areas <- sort(unique(data$area))
grid_times <- seq(
  from = min(data$bucket),
  to   = max(data$bucket),
  by   = bucket_seconds
)
grid <- expand.grid(
  area     = areas,
  datetime = grid_times,
  KEEP.OUT.ATTRS = FALSE,
  stringsAsFactors = FALSE
)

timeline <- merge(grid, agg, by = c("area", "datetime"), all.x = TRUE)
timeline$n[         is.na(timeline$n)        ] <- 0      # 0 reports
timeline$severity[  is.na(timeline$severity) ] <- NA     # still NA for now

# Empirical-Bayes shrinkage per slot 
# smoothing constant = median report count across non-empty slots
m <- median(agg$n)

# pre-compute global mean severity for each time slot (across all areas)
slot_mean <- tapply(agg$severity, agg$datetime, mean, na.rm = TRUE)

timeline$global_mean <- slot_mean[ as.character(timeline$datetime) ]

overall_mean <- mean(agg$severity, na.rm = TRUE)
timeline$global_mean[ is.na(timeline$global_mean) ] <- overall_mean

# Replace NA severity with global mean keeping formula numeric
sev_no_na <- ifelse(is.na(timeline$severity), timeline$global_mean,timeline$severity)

timeline$severity <- (timeline$n / (timeline$n + m)) * sev_no_na +
(m           / (timeline$n + m)) * timeline$global_mean

# Optional small-gap smoothing (≤2 empty slots)
fill_short_na <- function(v, maxgap = 2) {
  nas <- is.na(v)
  if (all(!nas)) return(v)
  idx <- seq_along(v)
  filled <- approx(idx[!nas], v[!nas], idx, rule = 2)$y
  rle_na <- rle(nas); ends <- cumsum(rle_na$lengths)
  starts <- ends - rle_na$lengths + 1
  for (k in seq_along(starts))
    if (rle_na$values[k] && rle_na$lengths[k] > maxgap)
      filled[ starts[k]:ends[k] ] <- NA
  filled
}

timeline <- timeline[ order(timeline$area, timeline$datetime), ]
by_area  <- split(timeline, timeline$area)
for (a in names(by_area))
  by_area[[a]]$severity <- fill_short_na(by_area[[a]]$severity, 2)
timeline <- do.call(rbind, by_area)
row.names(timeline) <- NULL

# round to 2 dp for clarity
timeline$severity <- round(timeline$severity, 2)

# Export
write.csv(
  timeline[ , c("datetime", "area", "severity")],
  outfile,
  row.names = FALSE
)
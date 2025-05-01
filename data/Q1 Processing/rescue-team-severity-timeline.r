# ---------- parameters --------------------------------------------------------
infile  <- "data/resources/mc1-report-data-processed.csv"   # raw file
outfile <- "app/public/data/resources/rescue-team-timeline.csv"           # final output
tz_data <- "UTC"
# ---------- 1. load -----------------------------------------------------------
raw <- read.csv(infile, stringsAsFactors = FALSE)

# ---------- 2. unify & trim ---------------------------------------------------
raw$datetime <- as.POSIXct(
  paste(raw$date, raw$timestamp),
  tz = tz_data
)

data <- raw[ , c("location", "datetime", "buildings", "shake_intensity")]
names(data)[1] <- "area"                # nicer column name
data$day <- as.Date(data$datetime, tz = tz_data)

# ---------- 3. median-based imputation ---------------------------------------
for (col in c("buildings", "shake_intensity")) {

  # area-day medians as a 2-D table
  med_tbl      <- tapply(data[[col]],
                         list(data$area, as.character(data$day)),
                         function(x) median(x, na.rm = TRUE))
  global_med   <- median(data[[col]], na.rm = TRUE)

  # fill NAs
  for (i in seq_len(nrow(data))) {

    if (is.na(data[[col]][i])) {

      m <- med_tbl[ data$area[i], as.character(data$day[i]) ]
      if (is.na(m)) m <- global_med
      data[[col]][i] <- m
    }
  }
}

# ---------- 4. record-level severity -----------------------------------------
data$severity <- 0.7 * data$buildings + 0.3 * data$shake_intensity

# ---------- 5. full 3-h grid --------------------------------------------------
areas <- unique(data$area)
grid_times <- seq(
  from = as.POSIXct("2020-04-06 00:00:00", tz = tz_data),
  to   = as.POSIXct("2020-04-11 00:00:00", tz = tz_data),
  by   = 3 * 3600
)
grid <- expand.grid(
  area     = areas,
  datetime = grid_times,
  KEEP.OUT.ATTRS = FALSE,
  stringsAsFactors = FALSE
)

# ---------- 6. bucket raw timestamps -----------------------------------------
bucket_seconds <- 3 * 3600
data$bucket <- as.POSIXct(
  floor(as.numeric(data$datetime) / bucket_seconds) * bucket_seconds,
  origin = "1970-01-01", tz = tz_data
)

# ---------- 7. aggregate to 3-h slots ----------------------------------------
agg <- aggregate(
  data$severity,
  by   = list(area = data$area, datetime = data$bucket),
  FUN  = mean
)
names(agg)[3] <- "severity"

# ---------- 8. merge with blank grid -----------------------------------------
timeline <- merge(grid, agg, by = c("area", "datetime"), all.x = TRUE)

# ---------- 9. fill ≤ 2-slot gaps (optional) ---------------------------------
fill_short_na <- function(v, maxgap = 2) {
  n   <- length(v)
  idx <- seq_len(n)
  nas <- is.na(v)

  if (all(!nas)) return(v)  # nothing to do

  # full linear interpolation (rule = 2 keeps edges fixed)
  filled <- approx(idx[!nas], v[!nas], idx, rule = 2)$y

  # restore long gaps as NA
  rle_na <- rle(nas)
  ends   <- cumsum(rle_na$lengths)
  starts <- ends - rle_na$lengths + 1

  for (k in seq_along(rle_na$lengths)) {
    if (rle_na$values[k] && rle_na$lengths[k] > maxgap) {
      filled[ starts[k]:ends[k] ] <- NA
    }
  }
  filled
}

timeline <- timeline[order(timeline$area, timeline$datetime), ]
split_by_area <- split(timeline, timeline$area)

for (a in names(split_by_area)) {
  split_by_area[[a]]$severity <-
    fill_short_na(split_by_area[[a]]$severity, maxgap = 2)
}

timeline <- do.call(rbind, split_by_area)
row.names(timeline) <- NULL

# ---------- 10. export --------------------------------------------------------
write.csv(
  timeline[ , c("datetime", "area", "severity")],
  outfile,
  row.names = FALSE
)

cat("✓ severity timeline written to", outfile, "\n")

#  Paths
RAW_FILE <- "data/resources/mc1-report-data.csv"
OUT_DIR  <- "app/public/data/resources/Q3"
OUT_FILE <- file.path(OUT_DIR, "candlesseverity.csv")

# Load 
df <- read.csv(RAW_FILE, stringsAsFactors = FALSE)

#  Parse time 
parse_time <- function(x) {
  x <- sub("Z$", "", x)          # drop trailing Z
  x <- sub("T",  " ", x)         # ISO -> space
  strptime(x, "%Y-%m-%d %H:%M:%S", tz = "Europe/London")
}
df$time <- parse_time(df$time)
df      <- df[!is.na(df$time), ] # keep only parsed rows

# Restrict to study window
window_start <- as.POSIXct("2020-04-06 00:00:00", tz = "Europe/London")
window_end   <- as.POSIXct("2020-04-10 11:59:59", tz = "Europe/London")
df <- df[df$time >= window_start & df$time <= window_end, ]

# Raw severity (row mean) 
sev_fields <- c("sewer_and_water",
                "power",
                "roads_and_bridges",
                "medical",
                "buildings",
                "shake_intensity")

missing <- sev_fields[!(sev_fields %in% names(df))]
if (length(missing))
  stop("Missing severity columns: ", paste(missing, collapse = ", "))

df$sev_raw <- rowMeans(df[ , sev_fields], na.rm = TRUE)

# Normalise per location (0-10) 
if (!("location" %in% names(df)))
  stop("Column 'location' not found in data.")

locs <- unique(df$location)
loc_min <- setNames(numeric(length(locs)), locs)
loc_max <- setNames(numeric(length(locs)), locs)

for (loc in locs) {
  v <- df$sev_raw[df$location == loc]
  loc_min[loc] <- min(v, na.rm = TRUE)
  loc_max[loc] <- max(v, na.rm = TRUE)
}

loc_span <- pmax(loc_max - loc_min, 1e-9)   # guard-rail for 0 span
df$sev_norm <- 10 * (df$sev_raw - loc_min[df$location]) /
                      loc_span[df$location]

# Build 60-minute intervals 
breaks <- seq(window_start,
              as.POSIXct("2020-04-10 12:00:00", tz = "Europe/London"),
              by = 3600)                     # 3600 s = 60 min
n_int <- length(breaks) - 1
idx   <- cut(df$time, breaks, right = FALSE, labels = FALSE)

# pre-allocate vectors
open   <- rep(NA_real_, n_int)
high   <- rep(NA_real_, n_int)
low    <- rep(NA_real_, n_int)
close  <- rep(NA_real_, n_int)
volume <- rep(0L,       n_int)

#  OHLC + volume
for (i in seq_len(n_int)) {
  rows <- which(idx == i)
  if (length(rows)) {
    ord       <- order(df$time[rows])
    sev_i     <- df$sev_norm[rows]
    open[i]   <- sev_i[ord[1]]
    close[i]  <- sev_i[ord[length(ord)]]
    high[i]   <- max(sev_i, na.rm = TRUE)
    low[i]    <- min(sev_i, na.rm = TRUE)
    volume[i] <- length(rows)
  }
}

# Carry-forward empty candles 
last_close <- 0
for (i in seq_len(n_int)) {
  if (is.na(open[i])) {
    open[i]  <- last_close
    high[i]  <- last_close
    low[i]   <- last_close
    close[i] <- last_close
    # volume already 0
  }
  last_close <- close[i]
}

# Heikin-Ashi transform 
# compute HA close as the average of the regular OHLC
ha_close <- (open + high + low + close) / 4

# init HA open: midpoint of first real candle
ha_open  <- numeric(n_int)
ha_open[1] <- (open[1] + close[1]) / 2

# subsequent HA opens are average of prior HA open & HA close
for (i in 2:n_int) {
  ha_open[i] <- (ha_open[i-1] + ha_close[i-1]) / 2
}

# HA high/low are extremes of the HA open, HA close, and real high/low
ha_high <- pmax(high, ha_open, ha_close)
ha_low  <- pmin(low,  ha_open, ha_close)

# Assemble & write 
out <- data.frame(
  interval_start = breaks[-length(breaks)],
  open   = round(ha_open,   3),
  high   = round(ha_high,   3),
  low    = round(ha_low,    3),
  close  = round(ha_close,  3),
  volume = volume,
  stringsAsFactors = FALSE
)

if (!dir.exists(OUT_DIR))
  dir.create(OUT_DIR, recursive = TRUE, showWarnings = FALSE)

write.csv(out, OUT_FILE, row.names = FALSE)

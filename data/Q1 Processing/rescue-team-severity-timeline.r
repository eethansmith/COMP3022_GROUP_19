# 1. Read the data
df <- read.csv(
  "data/resources/mc1-report-data-hourly-rounded.csv",
  na.strings = c("NA", "")  # Treat "NA" and empty strings as missing
)

# 2. Compute severity score
severity_score <- numeric(nrow(df))  # Initialize vector

for (i in 1:nrow(df)) {
  b <- df$buildings[i]
  s <- df$shake_intensity[i]
  
  if (!is.na(b) & !is.na(s)) {
    severity_score[i] <- 0.7 * b + 0.3 * s
  } else if (!is.na(b) & is.na(s)) {
    severity_score[i] <- b
  } else if (is.na(b) & !is.na(s)) {
    severity_score[i] <- s
  } else {
    severity_score[i] <- NA  # Both missing
  }
}

# 3. Build the result dataframe
result <- data.frame(
  date           = df$date,       # keep the date
  time           = df$timestamp,  # keep the time
  area           = df$location,
  severity_score = severity_score
)

# Drop rows with no score
result <- result[!is.na(result$severity_score), ]

# 4. Parse datetime and compute "hours since start"
result$datetime <- as.POSIXct(
  paste(result$date, result$time),
  format = "%Y-%m-%d %H:%M:%S"
)

# find the very first timestamp
start_time <- min(result$datetime, na.rm = TRUE)

# hours since that first time
result$hours_since_start <- as.numeric(
  difftime(result$datetime, start_time, units = "hours")
)

# 5. Round those hours into 3-hour groups
#    e.g. 0–2 → 0, 3–5 → 3, …, 96–98 → 96, etc.
result$hour <- floor(result$hours_since_start / 3) * 3

# 6. Aggregate by area + 3-hour bin (mean), then round to 2 dp
agg_result <- aggregate(
  severity_score ~ hour + area,
  data = result,
  FUN  = mean
)
agg_result$severity_score <- round(agg_result$severity_score, 2)

# 7. Save CSV
#    Columns: hour, area, severity_score
write.csv(
  agg_result,
  "data/resources/rescue-service-timeline.csv",
  row.names = FALSE
)

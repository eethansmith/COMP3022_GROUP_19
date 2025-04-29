df <- read.csv(
  "data/resources/mc1-report-data-hourly-rounded.csv",
  na.strings = c("NA", "")  # Treat "NA" and empty strings as missing
)

severity_score <- numeric(nrow(df)) 

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
    severity_score[i] <- NA 
  }
}

result <- data.frame(
  date           = df$date,      
  time           = df$timestamp, 
  area           = df$location,
  severity_score = severity_score
)

result <- result[!is.na(result$severity_score), ]

result$datetime <- as.POSIXct(
  paste(result$date, result$time),
  format = "%Y-%m-%d %H:%M:%S"
)

start_time <- min(result$datetime, na.rm = TRUE)

result$hours_since_start <- as.numeric(
  difftime(result$datetime, start_time, units = "hours")
)

result$hour <- floor(result$hours_since_start / 5) * 5

agg_result <- aggregate(
  severity_score ~ hour + area,
  data = result,
  FUN  = mean
)
agg_result$severity_score <- round(agg_result$severity_score, 2)

write.csv(
  agg_result,
  "app/public/data/resources/rescue-service-timeline.csv",
  row.names = FALSE
)

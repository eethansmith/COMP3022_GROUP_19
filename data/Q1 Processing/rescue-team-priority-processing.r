df <- read.csv(
  "data/resources/mc1-report-data-hourly-rounded.csv",
  na.strings = c("NA", "")   # Treat both "NA" and empty strings as NA
)

df_clean <- df[!is.na(df$buildings) & !is.na(df$shake_intensity), ]

df_clean$priorityScore <- 0.7 * df_clean$buildings + 0.3 * df_clean$shake_intensity

zone_priority <- aggregate(priorityScore ~ location, data = df_clean, FUN = function(x) round(mean(x) * 1.5, 2))


zone_priority <- zone_priority[order(-zone_priority$priorityScore), ]

write.csv(zone_priority, "data/resources/rescue-service-priority.csv", row.names = FALSE)

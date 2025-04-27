## ------------------------------------------------------------
## Priority-score pipeline (Base R version, no readr or dplyr)
## ------------------------------------------------------------

# 1 ── Read the data using base R --------------------------------------------
df <- read.csv(
  "data/resources/mc1-report-data-hourly-rounded.csv",
  na.strings = c("NA", "")   # Treat both "NA" and empty strings as NA
)

# 2 ── Remove rows with missing buildings or shake_intensity -----------------
df_clean <- df[!is.na(df$buildings) & !is.na(df$shake_intensity), ]

# 3 ── Compute the priority score --------------------------------------------
df_clean$priorityScore <- 0.7 * df_clean$buildings + 0.3 * df_clean$shake_intensity

# 4 ── Aggregate mean score per location, multiply by 2, rounded to 1 decimal ---------------
zone_priority <- aggregate(priorityScore ~ location, data = df_clean, FUN = function(x) round(mean(x) * 1.5, 2))


# 5 ── Order by descending priority score ------------------------------------
zone_priority <- zone_priority[order(-zone_priority$priorityScore), ]

# 6 ── Export the result to CSV ----------------------------------------------
write.csv(zone_priority, "data/resources/rescue-service-priority.csv", row.names = FALSE)

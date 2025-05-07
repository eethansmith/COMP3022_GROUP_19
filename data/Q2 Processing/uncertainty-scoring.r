library(dplyr)

# 1. Load data (make sure the path/filename matches yours)
df <- read.csv("data/resources/mc1-report-data.csv", stringsAsFactors = FALSE)

# 2. Parse datetime directly from the 'time' column
df$datetime <- as.POSIXct(df$time, format = "%Y-%m-%d %H:%M:%S")

# 3. Calculate raw metrics per location
df_q2 <- df %>%
  group_by(location) %>%
  summarise(
    report_count        = n(),
    std_dev_buildings   = sd(buildings, na.rm = TRUE),
    missing_shake_pct   = sum(is.na(shake_intensity)) / n()
  ) %>%
  # 4. Normalize metrics to 0–1 scale
  mutate(
    normalized_report_count = 1 - (report_count - min(report_count)) / (max(report_count) - min(report_count)),
    normalized_std_dev      = (std_dev_buildings - min(std_dev_buildings, na.rm = TRUE)) /
                              (max(std_dev_buildings, na.rm = TRUE) - min(std_dev_buildings, na.rm = TRUE))
  ) %>%
  # 5. Replace NaN with 0
  replace(is.na(.), 0) %>%
  # 6. Compute uncertainty & reliability, and bucket data-quality
  mutate(
    uncertainty_score   = 0.3 * normalized_report_count +
                          0.5 * normalized_std_dev +
                          0.2 * missing_shake_pct,
    reliability_score   = 1 - uncertainty_score,
    uncertainty_level   = case_when(
                            uncertainty_score <= 0.3 ~ "Low",
                            uncertainty_score <= 0.6 ~ "Moderate",
                            TRUE                     ~ "High"
                          ),
    data_quality_range  = case_when(
                            missing_shake_pct > 0.5          | report_count < 200 ~ 0,
                            (missing_shake_pct > 0.1 &
                             missing_shake_pct <= 0.5)        |
                            (report_count > 100 &
                             report_count < 200)              ~ 1,
                            TRUE                                           ~ 2
                          )
  )

# 7. Write your final CSV
write.csv(df_q2,
          "app/public/data/resources/Q2/uncertainty-scores.csv",
          row.names = FALSE)

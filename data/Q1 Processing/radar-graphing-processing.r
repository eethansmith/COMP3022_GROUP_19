set.seed(123)         # reproducible bootstrap
lambda    <- 5        # pseudo-count for shrinkage
boot_iter <- 1000     # # of bootstrap replications

df <- read.csv("data/resources/mc1-report-data-processed.csv", stringsAsFactors = FALSE)


metrics10 <- c("sewer_and_water","power","roads_and_bridges","medical","buildings")

for(m in metrics10) {
  df[[m]] <- df[[m]] / 10
}

df$shake_intensity <- df$shake_intensity / 9

all_metrics <- c(metrics10, "shake_intensity")
global_mean <- sapply(all_metrics,
                      function(m) mean(df[[m]], na.rm = TRUE))

metric_stats <- function(x, prior_mean, trim = 0.1) {
  x <- x[!is.na(x)]
  n <- length(x)
  if(n == 0) {
    return(list(score = NA, n = 0, ci_low = NA, ci_high = NA))
  }

  tmean <- mean(x, trim = trim)

  score <- (n / (n + lambda)) * tmean + (lambda / (n + lambda)) * prior_mean

  if(n < 2) {
    ci <- c(NA, NA)
  } else {
    boots <- replicate(boot_iter, {
      samp <- sample(x, size = n, replace = TRUE)
      mean(samp, trim = trim)
    })
    ci <- quantile(boots, probs = c(0.05, 0.95))
  }
  list(score = score, n = n,
       ci_low = ci[1], ci_high = ci[2])
}

areas <- sort(unique(df$location))
out <- vector("list", length(areas))

for(i in seq_along(areas)) {
  a <- areas[i]
  sub <- df[df$location == a, , drop = FALSE]
  row <- list(area = a,
              total_reports = nrow(sub))

  for(m in all_metrics) {
    stats <- metric_stats(sub[[m]], prior_mean = global_mean[m])
    row[[paste0(m, "_score")]]  <- stats$score
    row[[paste0(m, "_n")]]      <- stats$n
    row[[paste0(m, "_ci_low")]] <- stats$ci_low
    row[[paste0(m, "_ci_high")]]<- stats$ci_high
  }
  out[[i]] <- row
}

round_cols <- grep("(_score|_ci_low|_ci_high)$", names(out_df), value=TRUE)
out_df[round_cols] <- lapply(out_df[round_cols], round, digits = 3)

write.csv(out_df,
          "app/public/data/resources/radar-graph-areas.csv",
          row.names = FALSE)

# ------------------------------------------------------------------------------
# Equation explanation:
#
# 1.  Normalisation:
#     - Metrics on a 0–10 scale are divided by 10; shake_intensity (0–9) is divided by 9.
#       This maps all values into [0,1].
#
# 2.  Trimmed mean (tmean):
#     - tmean = mean(x, trim = 0.1)
#       i.e. the mean of the middle 80% of the sample, which reduces the impact of outliers.
#
# 3.  Empirical-Bayes shrinkage (“score”):
#     - score = (n / (n + λ)) * tmean
#             + (λ / (n + λ)) * global_mean
#       • n          = number of non-missing reports in this area for the metric
#       • λ (lambda) = pseudo-count (here, 5) representing how many “virtual” reports
#                      we borrow from the global distribution
#       • global_mean = the overall mean of that metric (after normalisation)
#
#     This formula “pulls” area estimates toward the global average when n is small,
#     but relies almost entirely on the area’s data when n ≫ λ.
#
# 4.  Bootstrap confidence intervals (ci_low, ci_high):
#     - We resample the area’s data with replacement boot_iter times, each time
#       computing the 10% trimmed mean. The 5th and 95th percentiles of those
#       bootstrapped trimmed means give a 90% CI for the underlying metric.
#
# Final output:
#   For each area and each metric, we export:
#     • <metric>_score     – shrunk, trimmed mean in [0,1]
#     • <metric>_n         – count of reports used
#     • <metric>_ci_low    – lower 5% bootstrap bound
#     • <metric>_ci_high   – upper 95% bootstrap bound
#   plus total_reports = total rows for that area.
#
#   Rounded to two decimals and ready for plotting on a radar chart.
# ------------------------------------------------------------------------------

####################################################################
#  Multi-service earthquake-response priority scores   (base R)
#  Generates: rescue-priority.csv, medical-priority.csv,
#             utilities-priority.csv, traffic-priority.csv
####################################################################

### 1. Load data ----------------------------------------------------
df <- read.csv(
  "data/resources/mc1-report-data-processed.csv",
  stringsAsFactors = FALSE
)

### 2. Weight definitions ------------------------------------------
weight_sets <- list(
  rescue = c(
    buildings        = 0.70,
    medical          = 0.10,
    roads_and_bridges= 0.05,
    power            = 0.05,
    shake_intensity  = 0.10
  ),
  medical = c(
    medical          = 0.55,
    buildings        = 0.15,
    roads_and_bridges= 0.15,
    power            = 0.05,
    shake_intensity  = 0.10
  ),
  utilities = c(
    power            = 0.40,
    sewer_and_water  = 0.35,
    roads_and_bridges= 0.15,
    shake_intensity  = 0.10
  ),
  traffic = c(
    roads_and_bridges= 0.60,
    sewer_and_water  = 0.15,
    buildings        = 0.10,
    power            = 0.05,
    shake_intensity  = 0.10
  )
)

### 3. Helper functions --------------------------------------------
row_weighted_mean <- function(x, w_vec) {
  good <- !is.na(x)
  if (!any(good)) return(NA_real_)
  sum(x[good] * w_vec[good]) / sum(w_vec[good])
}

calc_priority <- function(df_in, w) {

  # 3a – per-report severity ---------------------------------------
  needed  <- names(w)
  missing <- setdiff(needed, names(df_in))
  if (length(missing))
    stop("Data missing columns: ", paste(missing, collapse = ", "))

  sev <- apply(df_in[ needed ], 1, row_weighted_mean, w_vec = w)

  # 4 – aggregate by location --------------------------------------
  agg <- aggregate(
    sev ~ location,
    data = data.frame(location = df_in$location, sev = sev),
    FUN  = function(x) c(
      n  = length(x),
      mn = mean(x, na.rm = TRUE),
      sd = sd(x,   na.rm = TRUE)
    )
  )

  loc <- data.frame(
    location = agg$location,
    n        = agg$sev[ , "n" ],
    mean_sev = agg$sev[ , "mn"],
    sd_sev   = agg$sev[ , "sd"],
    row.names = NULL
  )

  # 5 – empirical-Bayes shrinkage ----------------------------------
  mu_global <- mean(sev, na.rm = TRUE)
  m         <- median(loc$n)

  loc$adjusted <- (loc$n / (loc$n + m)) * loc$mean_sev +
                  (m     / (loc$n + m)) * mu_global

  # 6 – rescale 0-to-10 & round ------------------------------------
  rng <- range(loc$adjusted)
  loc$rating <- round(
    10 * (loc$adjusted - rng[1]) / diff(rng),
    2
  )

  loc[ order(-loc$rating), ]
}

### 4. Run for each service & save ---------------------------------
out_dir <- "app/public/data/resources"
dir.create(out_dir, recursive = TRUE, showWarnings = FALSE)

for (svc in names(weight_sets)) {
  loc_stats <- calc_priority(df, weight_sets[[svc]])
  write.csv(
    loc_stats,
    file.path(out_dir, paste0(svc, "-priority.csv")),
    row.names = FALSE
  )
}
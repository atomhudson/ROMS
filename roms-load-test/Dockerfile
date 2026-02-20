FROM grafana/k6:latest

WORKDIR /scripts
COPY load-test.js .

# K6 reads SCENARIO via __ENV.SCENARIO in the script.
# The grafana/k6 image entrypoint is already "k6".
# We launch with shell so $SCENARIO env var is expanded.
ENTRYPOINT []
CMD ["sh", "-c", "k6 run --env BASE_URL=http://backend:8080 --env SCENARIO=${SCENARIO:-standard} /scripts/load-test.js"]

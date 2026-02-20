package com.datahook.oms.configuration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

/**
 * Configurable order status pipeline.
 * Define custom status flows in application.properties:
 *
 *   oms.pipeline.statuses[0].name=CREATED
 *   oms.pipeline.statuses[0].label=Order Placed
 *   oms.pipeline.statuses[0].terminal=false
 *   ...
 *
 * Any business can define their own pipeline without code changes.
 */
@Configuration
@ConfigurationProperties(prefix = "oms.pipeline")
public class PipelineConfig {

    private List<StatusDef> statuses = new ArrayList<>();

    public List<StatusDef> getStatuses() { return statuses; }
    public void setStatuses(List<StatusDef> statuses) { this.statuses = statuses; }

    /**
     * Check if a status name is valid according to the pipeline.
     */
    public boolean isValidStatus(String statusName) {
        return statuses.stream().anyMatch(s -> s.getName().equalsIgnoreCase(statusName));
    }

    /**
     * Check if a status is terminal (order complete).
     */
    public boolean isTerminal(String statusName) {
        return statuses.stream()
                .filter(s -> s.getName().equalsIgnoreCase(statusName))
                .findFirst()
                .map(StatusDef::isTerminal)
                .orElse(false);
    }

    public static class StatusDef {
        private String name;
        private String label;
        private boolean terminal;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }

        public boolean isTerminal() { return terminal; }
        public void setTerminal(boolean terminal) { this.terminal = terminal; }
    }
}

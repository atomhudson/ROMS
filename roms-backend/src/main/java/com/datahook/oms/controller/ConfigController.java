package com.datahook.oms.controller;

import com.datahook.oms.configuration.PipelineConfig;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Exposes the configurable pipeline to the frontend.
 * Frontend fetches this to render dynamic status steps instead of hardcoding.
 */
@RestController
@RequestMapping("/api/config")
@CrossOrigin("*")
public class ConfigController {

    private final PipelineConfig pipelineConfig;

    public ConfigController(PipelineConfig pipelineConfig) {
        this.pipelineConfig = pipelineConfig;
    }

    @GetMapping("/pipeline")
    public List<PipelineConfig.StatusDef> getPipeline() {
        return pipelineConfig.getStatuses();
    }
}

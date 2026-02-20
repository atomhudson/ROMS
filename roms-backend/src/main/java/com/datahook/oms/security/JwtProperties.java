package com.datahook.oms.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * JWT configuration properties bound from application.properties.
 *
 * oms.security.jwt.issuer       — expected "iss" claim (e.g. https://your-tenant.auth0.com/)
 * oms.security.jwt.audience     — expected "aud" claim (e.g. oms-api)
 * oms.security.jwt.jwks-url     — JWKS endpoint for public key discovery
 * oms.security.jwt.secret       — fallback HMAC secret for HS256 (dev/testing)
 */
@ConfigurationProperties(prefix = "oms.security.jwt")
public class JwtProperties {

    private String issuer = "oms-dev";
    private String audience = "oms-api";
    private String jwksUrl;
    private String secret;

    public String getIssuer() { return issuer; }
    public void setIssuer(String issuer) { this.issuer = issuer; }

    public String getAudience() { return audience; }
    public void setAudience(String audience) { this.audience = audience; }

    public String getJwksUrl() { return jwksUrl; }
    public void setJwksUrl(String jwksUrl) { this.jwksUrl = jwksUrl; }

    public String getSecret() { return secret; }
    public void setSecret(String secret) { this.secret = secret; }
}

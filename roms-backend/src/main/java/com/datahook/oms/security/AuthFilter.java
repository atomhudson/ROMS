package com.datahook.oms.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Servlet filter that extracts and validates JWT tokens from the Authorization header.
 * Sets AuthenticatedUser on the request for downstream controllers.
 *
 * Skips authentication for: /dev/**, /actuator/**, /api/config/**, /ws/**
 */
@Component
public class AuthFilter extends OncePerRequestFilter {

    private final IdentityProvider identityProvider;

    public AuthFilter(IdentityProvider identityProvider) {
        this.identityProvider = identityProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                AuthenticatedUser user = identityProvider.authenticate(token);
                request.setAttribute("authenticatedUser", user);
            } catch (Exception e) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write(
                        "{\"error\":\"" + e.getMessage().replace("\"", "'") + "\"}"
                );
                return;
            }
        }

        chain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/dev/")
                || path.startsWith("/actuator")
                || path.startsWith("/api/config")
                || path.startsWith("/ws");
    }
}

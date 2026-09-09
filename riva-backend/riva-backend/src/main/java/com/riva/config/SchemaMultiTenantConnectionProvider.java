package com.riva.config;

import lombok.RequiredArgsConstructor;
import org.hibernate.engine.jdbc.connections.spi.MultiTenantConnectionProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

@Component
@RequiredArgsConstructor
public class SchemaMultiTenantConnectionProvider implements MultiTenantConnectionProvider<String> {

    private static final Logger logger = LoggerFactory.getLogger(SchemaMultiTenantConnectionProvider.class);
    private static final String DEFAULT_SCHEMA = "public";

    private final DataSource dataSource;

    @Override
    public Connection getAnyConnection() throws SQLException {
        return dataSource.getConnection();
    }

    @Override
    public void releaseAnyConnection(Connection connection) throws SQLException {
        if (connection != null && !connection.isClosed()) {
            connection.close();
        }
    }

    @Override
    public Connection getConnection(String tenantIdentifier) throws SQLException {
        Connection connection = getAnyConnection();
        try {
            String sanitizedSchema = sanitizeSchemaName(tenantIdentifier);
            try (Statement statement = connection.createStatement()) {
                statement.execute("SET search_path TO " + sanitizedSchema + ", public");
            }
        } catch (SQLException e) {
            logger.error("Could not alter JDBC connection to schema {}", tenantIdentifier, e);
            releaseAnyConnection(connection);
            throw e;
        }
        return connection;
    }

    @Override
    public void releaseConnection(String tenantIdentifier, Connection connection) throws SQLException {
        try {
            if (connection != null && !connection.isClosed()) {
                try (Statement statement = connection.createStatement()) {
                    statement.execute("SET search_path TO " + DEFAULT_SCHEMA);
                }
            }
        } catch (SQLException e) {
            logger.warn("Could not reset search path to public on connection release", e);
        } finally {
            releaseAnyConnection(connection);
        }
    }

    @Override
    public boolean supportsAggressiveRelease() {
        return true;
    }

    @Override
    public boolean isUnwrappableAs(Class<?> unwrapType) {
        return false;
    }

    @Override
    public <T> T unwrap(Class<T> unwrapType) {
        return null;
    }

    private String sanitizeSchemaName(String tenantIdentifier) {
        if (tenantIdentifier == null || tenantIdentifier.trim().isEmpty()) {
            return "store_default";
        }
        // Sanitize to prevent SQL injection in search_path string
        String sanitized = tenantIdentifier.trim().toLowerCase();
        if (!sanitized.matches("^[a-z0-9_]+$")) {
            throw new IllegalArgumentException("Invalid schema name: " + tenantIdentifier);
        }
        return sanitized;
    }
}

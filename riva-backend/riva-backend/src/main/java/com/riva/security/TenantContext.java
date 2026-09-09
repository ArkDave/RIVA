package com.riva.security;

public class TenantContext {

    public static final String DEFAULT_TENANT = "store_default";
    private static final ThreadLocal<String> CURRENT_TENANT = new ThreadLocal<>();

    public static void setCurrentTenant(String tenantSchema) {
        if (tenantSchema != null && !tenantSchema.trim().isEmpty()) {
            CURRENT_TENANT.set(tenantSchema.toLowerCase().trim());
        } else {
            CURRENT_TENANT.set(DEFAULT_TENANT);
        }
    }

    public static String getCurrentTenant() {
        String tenant = CURRENT_TENANT.get();
        return (tenant != null) ? tenant : DEFAULT_TENANT;
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }
}

package com.riva;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.riva.models.User;
import com.riva.repositories.UserRepository;
import com.riva.security.TenantContext;
import java.util.Optional;

@SpringBootApplication
@EnableJpaAuditing
@EnableScheduling
public class RivaApplication {

    public static void main(String[] args) {
        SpringApplication.run(RivaApplication.class, args);
    }

    @Bean
    public CommandLineRunner resetAdminPassword(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            TenantContext.setCurrentTenant("store_default");
            try {
                Optional<User> adminOpt = userRepository.findByUsername("admin");
                if (adminOpt.isPresent()) {
                    User admin = adminOpt.get();
                    admin.setPassword(passwordEncoder.encode("admin123"));
                    userRepository.save(admin);
                    System.out.println("DEBUG: Admin password has been forcefully reset to 'admin123'");
                }
            } finally {
                TenantContext.clear();
            }
        };
    }
}

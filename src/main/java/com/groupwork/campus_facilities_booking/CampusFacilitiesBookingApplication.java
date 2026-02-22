package com.groupwork.campus_facilities_booking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
// @EnableScheduling  // Disabled for testing — re-enable after basic endpoints work
public class CampusFacilitiesBookingApplication {

	public static void main(String[] args) {
		SpringApplication.run(CampusFacilitiesBookingApplication.class, args);
		System.out.println("Campus Facilities Booking System started successfully!");
	}

}

package com.ticketmaster.ticketmaster.repository;

import com.ticketmaster.ticketmaster.model.Booking;
import com.ticketmaster.ticketmaster.model.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {
    List<Booking> findByStatusAndCreatedAtBefore(BookingStatus status, LocalDateTime cutoff);
    List<Booking> findByUserEmailOrderByCreatedAtDesc(String userEmail);
}
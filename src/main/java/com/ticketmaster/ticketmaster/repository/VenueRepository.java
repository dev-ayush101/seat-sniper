package com.ticketmaster.ticketmaster.repository;

import com.ticketmaster.ticketmaster.model.Venue;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface VenueRepository extends JpaRepository<Venue, UUID> {
}
package com.ticketmaster.ticketmaster.repository;

import com.ticketmaster.ticketmaster.model.Performer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface PerformerRepository extends JpaRepository<Performer, UUID> {
}
package com.ticketmaster.ticketmaster.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter @Setter
public class CreateEventRequest {
    private String name;
    private String description;
    private LocalDateTime eventDate;
    private String eventType;
    private UUID venueId;
    private UUID performerId;
}

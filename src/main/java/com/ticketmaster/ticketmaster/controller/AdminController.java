package com.ticketmaster.ticketmaster.controller;

import com.ticketmaster.ticketmaster.model.*;
import com.ticketmaster.ticketmaster.repository.*;
import com.ticketmaster.ticketmaster.dto.CreateEventRequest;
import com.ticketmaster.ticketmaster.service.EventSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final EventRepository eventRepository;
    private final BookingRepository bookingRepository;
    private final VenueRepository venueRepository;
    private final PerformerRepository performerRepository;
    private final UserRepository userRepository;
    private final EventSearchService eventSearchService;

    // Bookings
    @GetMapping("/bookings")
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    // Venues
    @GetMapping("/venues")
    public List<Venue> getAllVenues() {
        return venueRepository.findAll();
    }

    @PostMapping("/venues")
    public ResponseEntity<Venue> createVenue(@RequestBody Venue venue) {
        venue.setCreatedAt(LocalDateTime.now());
        return ResponseEntity.ok(venueRepository.save(venue));
    }

    // Performers
    @GetMapping("/performers")
    public List<Performer> getAllPerformers() {
        return performerRepository.findAll();
    }

    @PostMapping("/performers")
    public ResponseEntity<Performer> createPerformer(@RequestBody Performer performer) {
        performer.setCreatedAt(LocalDateTime.now());
        return ResponseEntity.ok(performerRepository.save(performer));
    }

    // Events
    @GetMapping("/events")
    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    @PostMapping("/events")
    public ResponseEntity<Event> createEvent(@RequestBody CreateEventRequest request) {
        Venue venue = venueRepository.findById(request.getVenueId())
                .orElseThrow(() -> new RuntimeException("Venue not found"));
        Performer performer = performerRepository.findById(request.getPerformerId())
                .orElseThrow(() -> new RuntimeException("Performer not found"));

        Event event = Event.builder()
                .name(request.getName())
                .description(request.getDescription())
                .eventDate(request.getEventDate())
                .eventType(request.getEventType())
                .venue(venue)
                .performer(performer)
                .createdAt(LocalDateTime.now())
                .build();

        Event saved = eventRepository.save(event);
        eventSearchService.syncAllEvents();
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/events/{eventId}")
    public ResponseEntity<Event> updateEvent(@PathVariable UUID eventId, @RequestBody CreateEventRequest request) {
        return eventRepository.findById(eventId).map(event -> {
            event.setName(request.getName());
            event.setDescription(request.getDescription());
            event.setEventDate(request.getEventDate());
            event.setEventType(request.getEventType());

            if (request.getVenueId() != null) {
                event.setVenue(venueRepository.findById(request.getVenueId())
                        .orElseThrow(() -> new RuntimeException("Venue not found")));
            }
            if (request.getPerformerId() != null) {
                event.setPerformer(performerRepository.findById(request.getPerformerId())
                        .orElseThrow(() -> new RuntimeException("Performer not found")));
            }

            Event saved = eventRepository.save(event);
            eventSearchService.syncAllEvents();
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/events/{eventId}")
    public ResponseEntity<Void> deleteEvent(@PathVariable UUID eventId) {
        if (!eventRepository.existsById(eventId)) {
            return ResponseEntity.notFound().build();
        }

        eventRepository.deleteById(eventId);
        eventSearchService.syncAllEvents();
        return ResponseEntity.noContent().build();
    }

    // User Management
    @PutMapping("/users/{email}/role")
    public ResponseEntity<String> updateRole(@PathVariable String email, @RequestBody Map<String, String> body) {
        return userRepository.findByEmail(email).map(user -> {
            user.setRole(body.get("role"));
            userRepository.save(user);
            return ResponseEntity.ok("Role updated to " + body.get("role"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
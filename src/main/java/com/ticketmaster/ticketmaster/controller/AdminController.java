package com.ticketmaster.ticketmaster.controller;

import com.ticketmaster.ticketmaster.model.*;
import com.ticketmaster.ticketmaster.repository.*;
import com.ticketmaster.ticketmaster.dto.CreateEventRequest;
import com.ticketmaster.ticketmaster.service.EventSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final EventRepository eventRepository;
    private final BookingRepository bookingRepository;
    private final VenueRepository venueRepository;
    private final PerformerRepository performerRepository;
    private final TicketRepository ticketRepository;
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
        venue.setSeatMap(generateSeatMap(venue.getCapacity()));
        venue.setCreatedAt(LocalDateTime.now());
        return ResponseEntity.ok(venueRepository.save(venue));
    }

    @PutMapping("/venues/{id}")
    public ResponseEntity<Venue> updateVenue(@PathVariable UUID id, @RequestBody Venue updated) {
        return venueRepository.findById(id).map(venue -> {
            venue.setName(updated.getName());
            venue.setAddress(updated.getAddress());
            boolean capacityChanged = venue.getCapacity() != updated.getCapacity();
            venue.setCapacity(updated.getCapacity());
            if (capacityChanged) {
                venue.setSeatMap(generateSeatMap(updated.getCapacity()));
            }
            return ResponseEntity.ok(venueRepository.save(venue));
        }).orElse(ResponseEntity.notFound().build());
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

    @PutMapping("/performers/{id}")
    public ResponseEntity<Performer> updatePerformer(@PathVariable UUID id, @RequestBody Performer updated) {
        return performerRepository.findById(id).map(performer -> {
            performer.setName(updated.getName());
            performer.setDescription(updated.getDescription());
            performer.setImageUrl(updated.getImageUrl());
            return ResponseEntity.ok(performerRepository.save(performer));
        }).orElse(ResponseEntity.notFound().build());
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

        // Generate tickets from venue seatMap
        Map<String, Object> seatMap = venue.getSeatMap();
        List<Map<String, Object>> sections = (List<Map<String, Object>>) seatMap.get("sections");
        BigDecimal price = request.getTicketPrice() != null ? request.getTicketPrice() : new BigDecimal("100.00");

        List<Ticket> tickets = new ArrayList<>();
        for (Map<String, Object> section : sections) {
            String sectionName = (String) section.get("name");
            List<String> rows = (List<String>) section.get("rows");
            int seatsPerRow = (int) section.get("seatsPerRow");

            for (String row : rows) {
                int rowNum = Integer.parseInt(row);
                int totalRows = rows.size();
                BigDecimal tierPrice;
                if (rowNum <= totalRows / 3) {
                    tierPrice = price.multiply(new BigDecimal("2.5"));
                } else if (rowNum <= (totalRows * 2) / 3) {
                    tierPrice = price.multiply(new BigDecimal("1.5"));
                } else {
                    tierPrice = price;
                }

                for (int seat = 1; seat <= seatsPerRow; seat++) {
                    tickets.add(Ticket.builder()
                            .eventId(saved.getId())
                            .section(sectionName)
                            .rowName(row)
                            .seatNumber(seat)
                            .price(tierPrice)
                            .status(TicketStatus.AVAILABLE)
                            .createdAt(LocalDateTime.now())
                            .build());
                }
            }
        }
        ticketRepository.saveAll(tickets);

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

    // Generate Seat Map (Multiple of 10)
    private Map<String, Object> generateSeatMap(int capacity) {
        int seatsPerRow = 10;
        int rows = (int) Math.ceil((double) capacity / seatsPerRow);
        List<String> rowNames = new ArrayList<>();
        for (int i = 1; i <= rows; i++) {
            rowNames.add(String.valueOf(i));
        }
        Map<String, Object> section = new HashMap<>();
        section.put("name", "A");
        section.put("rows", rowNames);
        section.put("seatsPerRow", seatsPerRow);

        Map<String, Object> seatMap = new HashMap<>();
        seatMap.put("sections", List.of(section));
        return seatMap;
    }
}
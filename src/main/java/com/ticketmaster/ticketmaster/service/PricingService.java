package com.ticketmaster.ticketmaster.service;

import com.ticketmaster.ticketmaster.model.Ticket;
import com.ticketmaster.ticketmaster.model.TicketStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class PricingService {

    public BigDecimal getSurgeMultiplier(List<Ticket> tickets) {
        long total = tickets.size();
        long sold = tickets.stream()
                .filter(t -> t.getStatus() == TicketStatus.BOOKED)
                .count();

        double fillPercent = (double) sold / total * 100;

        if (fillPercent >= 80) return new BigDecimal("2.0");
        if (fillPercent >= 50) return new BigDecimal("1.5");
        return new BigDecimal("1.0");
    }

    public BigDecimal applySurge(BigDecimal basePrice, BigDecimal multiplier) {
        return basePrice.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
    }

    public void applyDynamicPricing(List<Ticket> tickets) {
        BigDecimal multiplier = getSurgeMultiplier(tickets);
        for (Ticket ticket : tickets) {
            if (ticket.getStatus() != TicketStatus.BOOKED) {
                ticket.setPrice(applySurge(ticket.getPrice(), multiplier));
            }
        }
    }
}

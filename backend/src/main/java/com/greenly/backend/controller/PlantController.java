package com.greenly.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import java.time.LocalDate;
import org.springframework.web.bind.annotation.RestController;

import com.greenly.backend.dto.EventoRiego;
import com.greenly.backend.dto.PlantRequest;
import com.greenly.backend.dto.PlantResponse;
import com.greenly.backend.service.PlantService;
import com.greenly.backend.service.WateringSchedulerService;

@RestController
@RequestMapping("/api/plantas")
public class PlantController {
	private final PlantService plantService;
	private final WateringSchedulerService wateringSchedulerService;

	public PlantController(PlantService plantService, WateringSchedulerService wateringSchedulerService) {
		this.plantService = plantService;
		this.wateringSchedulerService = wateringSchedulerService;
	}

	@GetMapping
	public List<PlantResponse> findAll(Authentication authentication) {
		return plantService.findAll(authentication.getName());
	}

	@GetMapping("/eventos-riego")
	public List<EventoRiego> obtenerEventosRiego(
		Authentication authentication,
		@org.springframework.web.bind.annotation.RequestParam(required = false)
		@org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE)
		LocalDate fecha
	) {
		LocalDate fechaRef = fecha != null ? fecha : LocalDate.now();
		return wateringSchedulerService.evaluarEventosParaUsuario(authentication.getName(), fechaRef);
	}

	@PostMapping("/verificar-riegos")
	public List<EventoRiego> ejecutarVerificacionManual(
		@org.springframework.web.bind.annotation.RequestParam(required = false)
		@org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE)
		LocalDate fecha
	) {
		LocalDate fechaRef = fecha != null ? fecha : LocalDate.now();
		wateringSchedulerService.ejecutarVerificacionProgramada();
		return wateringSchedulerService.evaluarEventosRiego(fechaRef);
	}

	@PostMapping
	public ResponseEntity<PlantResponse> create(
		Authentication authentication,
		@RequestBody PlantRequest request
	) {
		return ResponseEntity.status(HttpStatus.CREATED)
			.body(plantService.create(authentication.getName(), request));
	}

	@PutMapping("/{id}")
	public PlantResponse update(
		Authentication authentication,
		@PathVariable Long id,
		@RequestBody PlantRequest request
	) {
		return plantService.update(authentication.getName(), id, request);
	}

	@PutMapping("/{id}/regar")
	public PlantResponse regar(Authentication authentication, @PathVariable Long id) {
		return plantService.regar(authentication.getName(), id);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(Authentication authentication, @PathVariable Long id) {
		plantService.delete(authentication.getName(), id);
		return ResponseEntity.noContent().build();
	}
}
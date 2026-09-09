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
import org.springframework.web.bind.annotation.RestController;

import com.greenly.backend.dto.PlantRequest;
import com.greenly.backend.dto.PlantResponse;
import com.greenly.backend.service.PlantService;

@RestController
@RequestMapping("/api/plantas")
public class PlantController {
	private final PlantService plantService;

	public PlantController(PlantService plantService) {
		this.plantService = plantService;
	}

	@GetMapping
	public List<PlantResponse> findAll(Authentication authentication) {
		return plantService.findAll(authentication.getName());
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

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(Authentication authentication, @PathVariable Long id) {
		plantService.delete(authentication.getName(), id);
		return ResponseEntity.noContent().build();
	}
}
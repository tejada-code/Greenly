package com.greenly.backend.controller;

import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.greenly.backend.dto.PlantIdentificationResponse;
import com.greenly.backend.service.PlantIdentificationService;

@RestController
@RequestMapping("/api/plantas")
public class PlantIdentificationController {
	private final PlantIdentificationService identificationService;

	public PlantIdentificationController(PlantIdentificationService identificationService) {
		this.identificationService = identificationService;
	}

	@PostMapping(value = "/identificar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public PlantIdentificationResponse identify(
		@RequestPart("imagen") MultipartFile image,
		Authentication authentication
	) {
		if (authentication == null) {
			throw new IllegalStateException("Debes iniciar sesión para identificar una planta");
		}
		return identificationService.identify(image);
	}
}
package com.greenly.backend.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import tools.jackson.databind.JsonNode;
import com.greenly.backend.dto.PlantIdentificationResponse;
import com.greenly.backend.entity.EspecieCatalogo;
import com.greenly.backend.repository.EspecieCatalogoRepository;

@Service
public class PlantIdentificationService {
	private static final Logger logger = LoggerFactory.getLogger(PlantIdentificationService.class);
	private final RestClient restClient;
	private final EspecieCatalogoRepository especieRepository;
	private final String apiKey;
	private final String project;

	public PlantIdentificationService(
		RestClient.Builder restClientBuilder,
		EspecieCatalogoRepository especieRepository,
		@Value("${plantnet.api-key}") String apiKey,
		@Value("${plantnet.project:all}") String project,
		@Value("${plantnet.base-url:https://my-api.plantnet.org}") String baseUrl
	) {
		this.restClient = restClientBuilder.baseUrl(baseUrl).build();
		this.especieRepository = especieRepository;
		this.apiKey = apiKey;
		this.project = project;
	}

	public PlantIdentificationResponse identify(MultipartFile image) {
		if (image == null || image.isEmpty()) {
			throw new IllegalArgumentException("Debes enviar una imagen");
		}
		if (image.getSize() > 5 * 1024 * 1024) {
			throw new IllegalArgumentException("La imagen no puede superar 5 MB");
		}
		if (image.getContentType() == null
			|| (!image.getContentType().equals(MediaType.IMAGE_JPEG_VALUE)
				&& !image.getContentType().equals(MediaType.IMAGE_PNG_VALUE))) {
			throw new IllegalArgumentException("La imagen debe estar en formato JPG o PNG");
		}
		if (apiKey.isBlank()) {
			throw new IllegalStateException("La API de Pl@ntNet no está configurada");
		}

		try {
			MultipartBodyBuilder form = new MultipartBodyBuilder();
			form.part("images", new ByteArrayResource(image.getBytes()) {
				@Override
				public String getFilename() {
					return image.getOriginalFilename() == null ? "plant.jpg" : image.getOriginalFilename();
				}
			})
				.filename(image.getOriginalFilename() == null ? "plant.jpg" : image.getOriginalFilename())
				.contentType(MediaType.parseMediaType(image.getContentType()));
			form.part("organs", "auto");

			JsonNode response = restClient.post()
				.uri(uriBuilder -> uriBuilder
					.path("/v2/identify/{project}")
					.queryParam("api-key", apiKey)
					.queryParam("nb-results", 5)
					.queryParam("lang", "es")
					.build(project))
				.contentType(MediaType.MULTIPART_FORM_DATA)
				.body(form.build())
				.retrieve()
				.body(JsonNode.class);
			return toResponse(response);
		} catch (Exception exception) {
			logger.error("Falló la solicitud de identificacion a Pl@ntNet: {}", exception.getMessage(), exception);
			throw new IllegalStateException("No se pudo identificar la planta con Pl@ntNet", exception);
		}
	}

	private PlantIdentificationResponse toResponse(JsonNode response) {
		JsonNode results = response.path("results");
		if (!results.isArray() || results.isEmpty()) {
			throw new IllegalArgumentException("No se pudo identificar una planta en la imagen");
		}

		JsonNode best = results.get(0);
		JsonNode species = best.path("species");
		String scientificName = species.path("scientificNameWithoutAuthor").asText();
		String commonName = species.path("commonNames").path(0).asText(null);
		String family = species.path("family").path("scientificNameWithoutAuthor").asText(null);
		EspecieCatalogo catalogo = especieRepository.findByNombreCientificoIgnoreCase(scientificName).orElse(null);

		List<PlantIdentificationResponse.AlternativeResult> alternatives = new ArrayList<>();
		for (int index = 1; index < Math.min(results.size(), 5); index++) {
			JsonNode result = results.get(index);
			alternatives.add(new PlantIdentificationResponse.AlternativeResult(
				result.path("species").path("scientificNameWithoutAuthor").asText(),
				result.path("score").asDouble()
			));
		}

		PlantIdentificationResponse.CareData care = catalogo == null ? null : new PlantIdentificationResponse.CareData(
			catalogo.getLuzRecomendada() == null ? null : catalogo.getLuzRecomendada().name(),
			catalogo.getFrecuenciaRiegoBaseDias(),
			catalogo.getDescripcion()
		);
		return new PlantIdentificationResponse(
			scientificName,
			commonName,
			family,
			best.path("score").asDouble(),
			care,
			alternatives
		);
	}
}
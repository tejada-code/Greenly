package com.greenly.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.greenly.backend.dto.PlantRequest;
import com.greenly.backend.dto.PlantResponse;
import com.greenly.backend.entity.EspecieCatalogo;
import com.greenly.backend.entity.PlantaUsuario;
import com.greenly.backend.entity.Usuario;
import com.greenly.backend.repository.EspecieCatalogoRepository;
import com.greenly.backend.repository.PlantaUsuarioRepository;
import com.greenly.backend.repository.UsuarioRepository;

@Service
public class PlantService {
	private final PlantaUsuarioRepository plantRepository;
	private final UsuarioRepository usuarioRepository;
	private final EspecieCatalogoRepository especieRepository;

	public PlantService(
		PlantaUsuarioRepository plantRepository,
		UsuarioRepository usuarioRepository,
		EspecieCatalogoRepository especieRepository
	) {
		this.plantRepository = plantRepository;
		this.usuarioRepository = usuarioRepository;
		this.especieRepository = especieRepository;
	}

	@Transactional(readOnly = true)
	public List<PlantResponse> findAll(String email) {
		Usuario usuario = getUser(email);
		return plantRepository.findAllByUsuarioId(usuario.getId()).stream().map(this::toResponse).toList();
	}

	@Transactional
	public PlantResponse create(String email, PlantRequest request) {
		if (request == null || request.nombreCientifico() == null || request.nombreCientifico().isBlank()) {
			throw new IllegalArgumentException("El nombre científico es obligatorio");
		}
		Usuario usuario = getUser(email);
		EspecieCatalogo especie = findOrCreateSpecies(request);
		PlantaUsuario plant = new PlantaUsuario(usuario, especie);
		plant.setNombrePersonalizado(request.nombrePersonalizado());
		plant.setUrlFotoUsuario(request.urlFotoUsuario());
		plant.setFechaAdquisicion(request.fechaAdquisicion());
		return toResponse(plantRepository.save(plant));
	}

	@Transactional
	public PlantResponse update(String email, Long id, PlantRequest request) {
		PlantaUsuario plant = getOwnedPlant(email, id);
		if (request.nombreCientifico() != null && !request.nombreCientifico().isBlank()) {
			plant.setEspecie(findOrCreateSpecies(request));
		}
		plant.setNombrePersonalizado(request.nombrePersonalizado());
		plant.setUrlFotoUsuario(request.urlFotoUsuario());
		plant.setFechaAdquisicion(request.fechaAdquisicion());
		return toResponse(plantRepository.save(plant));
	}

	@Transactional
	public void delete(String email, Long id) {
		plantRepository.delete(getOwnedPlant(email, id));
	}

	private EspecieCatalogo findOrCreateSpecies(PlantRequest request) {
		String scientificName = request.nombreCientifico().trim();
		return especieRepository.findByNombreCientificoIgnoreCase(scientificName).orElseGet(() -> especieRepository.save(
			new EspecieCatalogo(scientificName, request.nombreComun(), null, 7, null)
		));
	}

	private PlantaUsuario getOwnedPlant(String email, Long id) {
		Usuario usuario = getUser(email);
		return plantRepository.findById(id)
			.filter(plant -> plant.getUsuario().getId().equals(usuario.getId()))
			.orElseThrow(() -> new IllegalStateException("Planta no encontrada"));
	}

	private Usuario getUser(String email) {
		return usuarioRepository.findByEmailIgnoreCase(email)
			.orElseThrow(() -> new IllegalStateException("Usuario no encontrado"));
	}

	private PlantResponse toResponse(PlantaUsuario plant) {
		EspecieCatalogo species = plant.getEspecie();
		return new PlantResponse(
			plant.getId(),
			species.getNombreCientifico(),
			species.getNombreComun(),
			species.getLuzRecomendada() == null ? null : species.getLuzRecomendada().name(),
			species.getFrecuenciaRiegoBaseDias(),
			plant.getNombrePersonalizado(),
			plant.getUrlFotoUsuario(),
			plant.getFechaAdquisicion(),
			plant.getFechaRegistro()
		);
	}
}
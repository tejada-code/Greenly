package com.greenly.backend.service;

import java.time.LocalDateTime;
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

	@Transactional
	public PlantResponse regar(String email, Long id) {
		PlantaUsuario plant = getOwnedPlant(email, id);
		plant.setFechaUltimoRiego(LocalDateTime.now());
		return toResponse(plantRepository.save(plant));
	}

	@Transactional
	public void seedDemoPlants(String email) {
		Usuario usuario = getUser(email);

		// 1. Especie para RIEGO EFECTIVO inmediato (Frecuencia: 1 día)
		EspecieCatalogo especieRiego = especieRepository.findByNombreCientificoIgnoreCase("Mentha spicata")
			.orElseGet(() -> especieRepository.save(new EspecieCatalogo(
				"Mentha spicata",
				"Hierbabuena Express",
				EspecieCatalogo.LuzRecomendada.SEMISOMBRA,
				1,
				"Planta aromática fresca que requiere riego frecuente para mantenerse lozana y verde."
			)));
		especieRiego.setFrecuenciaRiegoBaseDias(1);
		especieRepository.save(especieRiego);

		// 2. Especie para REVISIÓN DE TIERRA (Frecuencia: 5 días)
		EspecieCatalogo especieRevision = especieRepository.findByNombreCientificoIgnoreCase("Dracaena trifasciata")
			.orElseGet(() -> especieRepository.save(new EspecieCatalogo(
				"Dracaena trifasciata",
				"Sansevieria Test",
				EspecieCatalogo.LuzRecomendada.INTERIOR_LUMINOSO,
				5,
				"Planta suculenta muy resistente ideal para interiores y purificación del aire."
			)));
		especieRevision.setFrecuenciaRiegoBaseDias(5);
		especieRepository.save(especieRevision);

		List<PlantaUsuario> plantas = plantRepository.findAllByUsuarioId(usuario.getId());

		// Planta 1: RIEGO EFECTIVO (fechaUltimoRiego hace 1 día, frecuencia 1 día -> HOY toca regar, 0 días restantes)
		PlantaUsuario p1 = plantas.stream()
			.filter(p -> "Hierbabuena Express".equalsIgnoreCase(p.getNombrePersonalizado())
				|| (p.getEspecie() != null && "Mentha spicata".equalsIgnoreCase(p.getEspecie().getNombreCientifico())))
			.findFirst()
			.orElseGet(() -> new PlantaUsuario(usuario, especieRiego));
		p1.setNombrePersonalizado("Hierbabuena Express");
		p1.setFechaUltimoRiego(LocalDateTime.now().minusDays(1).withHour(8).withMinute(0));
		if (p1.getUrlFotoUsuario() == null || p1.getUrlFotoUsuario().isBlank()) {
			p1.setUrlFotoUsuario("https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=800");
		}
		plantRepository.save(p1);

		// Planta 2: REVISIÓN DE TIERRA (fechaUltimoRiego hace 3 días, frecuencia 5 días -> proximo riego en 2 días, exactamente 2 días restantes)
		PlantaUsuario p2 = plantas.stream()
			.filter(p -> "Sansevieria Test".equalsIgnoreCase(p.getNombrePersonalizado())
				|| (p.getEspecie() != null && "Dracaena trifasciata".equalsIgnoreCase(p.getEspecie().getNombreCientifico())))
			.findFirst()
			.orElseGet(() -> new PlantaUsuario(usuario, especieRevision));
		p2.setNombrePersonalizado("Sansevieria Test");
		p2.setFechaUltimoRiego(LocalDateTime.now().minusDays(3).withHour(9).withMinute(0));
		if (p2.getUrlFotoUsuario() == null || p2.getUrlFotoUsuario().isBlank()) {
			p2.setUrlFotoUsuario("https://images.unsplash.com/photo-1599598425947-5202edd564c7?w=800");
		}
		plantRepository.save(p2);
	}

	private EspecieCatalogo findOrCreateSpecies(PlantRequest request) {
		String scientificName = request.nombreCientifico().trim();
		return especieRepository.findByNombreCientificoIgnoreCase(scientificName).map(species -> {
			boolean updated = false;
			if (species.getLuzRecomendada() == null) {
				species.setLuzRecomendada(resolveLuz(request.luzRecomendada(), scientificName, request.nombreComun()));
				updated = true;
			}
			if (species.getFrecuenciaRiegoBaseDias() == null || species.getFrecuenciaRiegoBaseDias() == 7) {
				Integer freq = request.frecuenciaRiegoBaseDias() != null ? request.frecuenciaRiegoBaseDias() : resolveFrecuencia(scientificName, request.nombreComun());
				species.setFrecuenciaRiegoBaseDias(freq);
				updated = true;
			}
			if (species.getDescripcion() == null || species.getDescripcion().isBlank()) {
				String desc = (request.descripcion() != null && !request.descripcion().isBlank()) ? request.descripcion() : resolveDescripcion(scientificName, request.nombreComun());
				species.setDescripcion(desc);
				updated = true;
			}
			return updated ? especieRepository.save(species) : species;
		}).orElseGet(() -> {
			EspecieCatalogo.LuzRecomendada luz = resolveLuz(request.luzRecomendada(), scientificName, request.nombreComun());
			Integer freq = request.frecuenciaRiegoBaseDias() != null ? request.frecuenciaRiegoBaseDias() : resolveFrecuencia(scientificName, request.nombreComun());
			String desc = (request.descripcion() != null && !request.descripcion().isBlank()) ? request.descripcion() : resolveDescripcion(scientificName, request.nombreComun());
			return especieRepository.save(new EspecieCatalogo(scientificName, request.nombreComun(), luz, freq, desc));
		});
	}

	private EspecieCatalogo.LuzRecomendada resolveLuz(String requestedLuz, String scientificName, String commonName) {
		if (requestedLuz != null && !requestedLuz.isBlank()) {
			try {
				return EspecieCatalogo.LuzRecomendada.valueOf(requestedLuz.toUpperCase());
			} catch (IllegalArgumentException ignored) {
			}
		}
		String search = (scientificName + " " + (commonName == null ? "" : commonName)).toLowerCase();
		if (search.contains("dracaena") || search.contains("sansevieria") || search.contains("suegra") || search.contains("calathea") || search.contains("helecho")) {
			return EspecieCatalogo.LuzRecomendada.SEMISOMBRA;
		} else if (search.contains("aloe") || search.contains("cact") || search.contains("succulent")) {
			return EspecieCatalogo.LuzRecomendada.SOL_DIRECTO;
		}
		return EspecieCatalogo.LuzRecomendada.INTERIOR_LUMINOSO;
	}

	private Integer resolveFrecuencia(String scientificName, String commonName) {
		String search = (scientificName + " " + (commonName == null ? "" : commonName)).toLowerCase();
		if (search.contains("dracaena") || search.contains("sansevieria") || search.contains("suegra") || search.contains("aloe") || search.contains("cact")) {
			return 14;
		} else if (search.contains("spathiphyllum") || search.contains("calathea") || search.contains("helecho")) {
			return 5;
		}
		return 7;
	}

	private String resolveDescripcion(String scientificName, String commonName) {
		String search = (scientificName + " " + (commonName == null ? "" : commonName)).toLowerCase();
		if (search.contains("dracaena") || search.contains("sansevieria") || search.contains("suegra") || search.contains("snake")) {
			return "Planta muy resistente y purificadora del aire. Excelente para principiantes ya que tolera la sequía.";
		} else if (search.contains("aloe") || search.contains("cact") || search.contains("succulent")) {
			return "Planta crasa muy resistente. Requiere riego espaciado y suelo bien drenado.";
		} else if (search.contains("monstera") || search.contains("philodendron")) {
			return "Planta tropical de crecimiento vigoroso. Prefiere luz filtrada y mantener humedad moderada.";
		}
		return "Planta resistente y adaptable a interiores y terrazas protegidas.";
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
			species.getDescripcion(),
			plant.getNombrePersonalizado(),
			plant.getUrlFotoUsuario(),
			plant.getFechaAdquisicion(),
			plant.getFechaRegistro(),
			plant.getFechaUltimoRiego()
		);
	}
}
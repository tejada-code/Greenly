package com.greenly.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.greenly.backend.entity.PlantaUsuario;

public interface PlantaUsuarioRepository extends JpaRepository<PlantaUsuario, Long> {
	List<PlantaUsuario> findAllByUsuarioId(Long usuarioId);

	@Query("SELECT p FROM PlantaUsuario p JOIN FETCH p.usuario JOIN FETCH p.especie")
	List<PlantaUsuario> findAllWithUsuarioAndEspecie();
}
package com.greenly.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.greenly.backend.entity.PlantaUsuario;

public interface PlantaUsuarioRepository extends JpaRepository<PlantaUsuario, Long> {
	List<PlantaUsuario> findAllByUsuarioId(Long usuarioId);
}
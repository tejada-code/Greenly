package com.greenly.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.greenly.backend.entity.EspecieCatalogo;

public interface EspecieCatalogoRepository extends JpaRepository<EspecieCatalogo, Long> {
	Optional<EspecieCatalogo> findByNombreCientificoIgnoreCase(String nombreCientifico);
}
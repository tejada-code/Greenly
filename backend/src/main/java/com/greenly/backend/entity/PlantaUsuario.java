package com.greenly.backend.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "plantas_usuario")
public class PlantaUsuario {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "usuario_id", nullable = false)
	private Usuario usuario;

	@ManyToOne(fetch = FetchType.EAGER, optional = false)
	@JoinColumn(name = "especie_id", nullable = false)
	private EspecieCatalogo especie;

	@Column(name = "nombre_personalizado", length = 100)
	private String nombrePersonalizado;

	@Column(name = "url_foto_usuario", length = 255)
	private String urlFotoUsuario;

	@Column(name = "fecha_adquisicion")
	private LocalDate fechaAdquisicion;

	@Column(name = "fecha_registro", nullable = false)
	private LocalDateTime fechaRegistro;

	protected PlantaUsuario() {
	}

	public PlantaUsuario(Usuario usuario, EspecieCatalogo especie) {
		this.usuario = usuario;
		this.especie = especie;
		this.fechaRegistro = LocalDateTime.now();
	}

	public Long getId() {
		return id;
	}

	public Usuario getUsuario() {
		return usuario;
	}

	public EspecieCatalogo getEspecie() {
		return especie;
	}

	public void setEspecie(EspecieCatalogo especie) {
		this.especie = especie;
	}

	public String getNombrePersonalizado() {
		return nombrePersonalizado;
	}

	public void setNombrePersonalizado(String nombrePersonalizado) {
		this.nombrePersonalizado = nombrePersonalizado;
	}

	public String getUrlFotoUsuario() {
		return urlFotoUsuario;
	}

	public void setUrlFotoUsuario(String urlFotoUsuario) {
		this.urlFotoUsuario = urlFotoUsuario;
	}

	public LocalDate getFechaAdquisicion() {
		return fechaAdquisicion;
	}

	public void setFechaAdquisicion(LocalDate fechaAdquisicion) {
		this.fechaAdquisicion = fechaAdquisicion;
	}

	public LocalDateTime getFechaRegistro() {
		return fechaRegistro;
	}
}
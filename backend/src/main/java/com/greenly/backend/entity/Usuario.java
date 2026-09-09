package com.greenly.backend.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "usuarios")
public class Usuario {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = 150)
	private String email;

	@Column(name = "password_hash", nullable = false, length = 255)
	private String passwordHash;

	@Column(nullable = false, length = 100)
	private String nombre;

	@Column(name = "fecha_registro", nullable = false)
	private LocalDateTime fechaRegistro;

	@Enumerated(EnumType.STRING)
	@Column(name = "estado_cuenta", nullable = false, length = 20)
	private EstadoCuenta estadoCuenta = EstadoCuenta.ACTIVO;

	@OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<PlantaUsuario> plantas = new ArrayList<>();

	protected Usuario() {
	}

	public Usuario(String email, String passwordHash, String nombre) {
		this.email = email;
		this.passwordHash = passwordHash;
		this.nombre = nombre;
		this.fechaRegistro = LocalDateTime.now();
	}

	public Long getId() {
		return id;
	}

	public String getEmail() {
		return email;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public String getNombre() {
		return nombre;
	}

	public LocalDateTime getFechaRegistro() {
		return fechaRegistro;
	}

	public EstadoCuenta getEstadoCuenta() {
		return estadoCuenta;
	}

	public List<PlantaUsuario> getPlantas() {
		return plantas;
	}

	public enum EstadoCuenta {
		ACTIVO,
		SUSPENDIDO,
		ELIMINADO
	}
}
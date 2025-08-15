# Guía de Importación CSV
## Guía Completa para Importar Usuarios al Sistema de Gestión de Desempeño

---

## Tabla de Contenidos
1. [Introducción](#introducción)
2. [Comenzando](#comenzando)
3. [Requisitos del Archivo CSV](#requisitos-del-archivo-csv)
4. [Descripción de Campos](#descripción-de-campos)
5. [Tipos de Usuario Explicados](#tipos-de-usuario-explicados)
6. [Proceso de Importación Paso a Paso](#proceso-de-importación-paso-a-paso)
7. [Ejemplos Comunes](#ejemplos-comunes)
8. [Solución de Problemas](#solución-de-problemas)
9. [Mejores Prácticas](#mejores-prácticas)
10. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Introducción

¡Bienvenido a la Guía de Importación CSV para el Sistema de Gestión de Desempeño! Esta guía te ayudará a importar datos de empleados de manera eficiente y precisa usando archivos CSV (Valores Separados por Comas).

**Lo que aprenderás:**
- Cómo preparar tus datos de empleados para la importación
- Entender diferentes tipos de usuarios y métodos de autenticación
- Proceso de importación paso a paso
- Cómo corregir errores comunes de importación

---

## Comenzando

### Antes de Empezar

**Necesitarás:**
- Datos de empleados en Excel o Google Sheets
- Acceso al Sistema de Gestión de Desempeño
- Permisos de rol HR o Administrador

### Lista de Verificación Rápida
- [ ] Descargar la plantilla CSV del sistema
- [ ] Preparar tus datos de empleados
- [ ] Revisar los requisitos de campos
- [ ] Probar con un lote pequeño primero
- [ ] Proceder con la importación completa

---

## Requisitos del Archivo CSV

### Formato de Archivo
- **Tipo de archivo:** `.csv` (Valores Separados por Comas)
- **Codificación:** UTF-8
- **Separador:** Coma (,)
- **Tamaño máximo de archivo:** 10MB
- **Máximo de registros:** Aproximadamente 10,000 empleados

### Columnas Requeridas
Tu archivo CSV **debe** incluir estas columnas en este orden exacto:

```
name,email,username,role,department,userType,employeeId,personID,managerPersonID,managerEmployeeId,position,shift,password
```

---

## Descripción de Campos

### 🟥 Campos Obligatorios (Deben ser llenados)

#### **name**
- Nombre completo del empleado
- **Ejemplo:** "Juan Pérez", "María García"
- **Requisitos:** No puede estar vacío

#### **role**
- Rol del empleado en el sistema
- **Opciones:** 
  - `employee` - Empleado regular
  - `manager` - Gerente/supervisor de equipo
  - `hr` - Personal de Recursos Humanos
- **Ejemplo:** "employee"

#### **personID**
- Número de identificación nacional (Cédula, DNI, etc.)
- **Propósito:** Identificación única para cada empleado
- **Ejemplo:** "123456789", "12345678-9"
- **Requisitos:** Debe ser único por empresa

### 🟨 Campos de Autenticación (Requeridos según tipo de usuario)

#### **email**
- Dirección de correo electrónico de trabajo
- **Requerido para:** Trabajadores de oficina
- **Opcional para:** Trabajadores operativos
- **Ejemplo:** "juan.perez@empresa.com"

#### **username**
- Nombre de usuario del sistema
- **Requerido para:** Trabajadores operativos, o como alternativa al email
- **Ejemplo:** "juanperez", "jperez"

#### **password**
- Contraseña de acceso o PIN
- **Para trabajadores de oficina:** Contraseña fuerte (8+ caracteres, mayúsculas, minúsculas, números, símbolos)
- **Para trabajadores operativos:** PIN simple (4-6 dígitos)
- **Ejemplos:** 
  - Oficina: "MiContraseña123!"
  - Operativo: "1234"

### 🟦 Campos Opcionales

#### **department**
- Departamento/división del empleado
- **Ejemplo:** "Ingeniería", "Ventas", "Recursos Humanos"

#### **userType**
- Tipo de trabajador
- **Opciones:**
  - `office` - Trabajadores de oficina (acceso a computadora, email)
  - `operational` - Trabajadores de campo/fábrica (acceso móvil/kiosco)
- **Por defecto:** "office"

#### **employeeId**
- Número de empleado asignado por la empresa
- **Ejemplo:** "EMP001", "E-12345"
- **Propósito:** Integración con sistemas HRIS

#### **position**
- Título del puesto/posición
- **Ejemplo:** "Ingeniero de Software", "Gerente de Ventas", "Operario"

#### **shift**
- Turno de trabajo
- **Ejemplo:** "Día", "Noche", "Mañana", "Tarde"

#### **managerPersonID**
- Cédula del gerente del empleado
- **Ejemplo:** "987654321"
- **Propósito:** Establece jerarquía de reporte

#### **managerEmployeeId**
- ID de empleado del gerente del empleado
- **Ejemplo:** "EMP002"
- **Propósito:** Forma alternativa de establecer relación de gerencia

---

## Tipos de Usuario Explicados

### 🏢 Usuarios de Oficina (`userType: office`)
**Quiénes son:** Trabajadores de escritorio, gerentes, administradores
**Método de acceso:** Navegador web, aplicación de escritorio
**Autenticación:** Email + Contraseña O Nombre de usuario + Contraseña

**Requisitos:**
- Debe tener `email` O `username` (o ambos)
- Debe tener una `password` fuerte
- Recomendado: Incluir `email` para mejor comunicación

**Ejemplo:**
```csv
Juan Pérez,juan.perez@empresa.com,jperez,employee,TI,office,EMP001,123456789,,,Desarrollador de Software,Día,MiContraseña123!
```

### 🏭 Usuarios Operativos (`userType: operational`)
**Quiénes son:** Trabajadores de fábrica, personal de campo, conductores
**Método de acceso:** Dispositivos móviles, kioscos, tablets
**Autenticación:** Nombre de usuario + PIN

**Requisitos:**
- Debe tener `username`
- `email` puede estar vacío
- Usar `password` simple (PIN: 4-6 dígitos)
- Usualmente acceden vía códigos QR o login simple

**Ejemplo:**
```csv
Carlos Trabajador,,ctrabajador,employee,Producción,operational,EMP003,345678901,987654321,EMP002,Operador de Máquina,Mañana,1234
```

---

## Proceso de Importación Paso a Paso

### Paso 1: Descargar Plantilla
1. Ve a **Usuarios** → **Avanzado** → **Importación Manual**
2. Haz clic en el botón **"Descargar Plantilla"**
3. Guarda el archivo `csv-import-template.csv`

### Paso 2: Preparar Tus Datos
1. Abre la plantilla en Excel o Google Sheets
2. **Mantén la fila de encabezado** (primera fila con nombres de columnas)
3. Reemplaza los datos de ejemplo con la información de tus empleados
4. Llena los campos requeridos para cada empleado

### Paso 3: Guardar como CSV
1. **En Excel:** Archivo → Guardar Como → Elegir "CSV (delimitado por comas)"
2. **En Google Sheets:** Archivo → Descargar → Valores separados por comas (.csv)
3. **Importante:** Mantener codificación UTF-8

### Paso 4: Proceso de Importación
1. Ve a la pestaña **Importación Manual**
2. Haz clic en **"Elegir Archivo"** o arrastra tu archivo CSV
3. Haz clic en **"Vista Previa de Importación"** para analizar tus datos
4. Revisa los resultados de la vista previa:
   - ✅ Usuarios válidos (serán importados)
   - ❌ Usuarios inválidos (necesitan corrección)
5. Haz clic en **"Configurar Importación"** si la vista previa se ve bien
6. Elige las opciones de importación:
   - ✅ Crear nuevos usuarios
   - ✅ Actualizar usuarios existentes
   - ✅ Saltar errores (recomendado para primera importación)
7. Haz clic en **"Ejecutar Importación"**
8. Revisa los resultados y descarga el reporte de errores si es necesario

---

## Ejemplos Comunes

### Ejemplo 1: Empleado de Oficina Completo
```csv
name,email,username,role,department,userType,employeeId,personID,managerPersonID,managerEmployeeId,position,shift,password
Sara González,sara.gonzalez@empresa.com,sgonzalez,employee,Marketing,office,EMP101,111222333,444555666,EMP200,Especialista en Marketing,Día,ContraseñaSegura2024!
```

### Ejemplo 2: Gerente (Sin Gerente Arriba)
```csv
name,email,username,role,department,userType,employeeId,personID,managerPersonID,managerEmployeeId,position,shift,password
Miguel Rodríguez,miguel.rodriguez@empresa.com,mrodriguez,manager,Ingeniería,office,EMP200,444555666,,,Gerente de Ingeniería,Día,ContraseñaGerente123!
```

### Ejemplo 3: Trabajador Operativo
```csv
name,email,username,role,department,userType,employeeId,personID,managerPersonID,managerEmployeeId,position,shift,password
Carlos Martínez,,cmartinez,employee,Producción,operational,EMP301,777888999,444555666,EMP200,Trabajador de Ensamble,Mañana,5678
```

### Ejemplo 4: Usuario de RH
```csv
name,email,username,role,department,userType,employeeId,personID,managerPersonID,managerEmployeeId,position,shift,password
Lisa Chen,lisa.chen@empresa.com,lchen,hr,Recursos Humanos,office,EMP999,555666777,,,Gerente de RH,Día,RHSeguro2024!
```

---

## Solución de Problemas

### Mensajes de Error Comunes

#### ❌ "Campo requerido faltante: name"
**Problema:** El campo de nombre está vacío
**Solución:** Llena el nombre completo del empleado

#### ❌ "Formato de email inválido"
**Problema:** El email no tiene el formato correcto
**Solución:** Usa formato como "usuario@dominio.com"

#### ❌ "El nombre de usuario ya existe"
**Problema:** Dos empleados tienen el mismo nombre de usuario
**Solución:** Haz únicos los nombres de usuario (agrega números: "jperez1", "jperez2")

#### ❌ "PersonID ya existe"
**Problema:** Dos empleados tienen la misma cédula
**Solución:** Verifica entradas duplicadas, asegúrate de que cada personID sea único

#### ❌ "Gerente no encontrado"
**Problema:** managerPersonID no coincide con ningún empleado existente
**Solución:** 
- Asegúrate de que el gerente sea importado primero
- Verifica dos veces el personID del gerente
- Deja los campos de gerente vacíos si no hay gerente

#### ❌ "Contraseña muy débil"
**Problema:** La contraseña no cumple los requisitos
**Solución:**
- Usuarios de oficina: Usa 8+ caracteres con mayúsculas, minúsculas, números, símbolos
- Usuarios operativos: Usa PIN de 4-6 dígitos

### Problemas del Proceso de Importación

#### 🔄 "Importación parcialmente completada"
**Qué pasó:** Algunos usuarios se importaron exitosamente, otros fallaron
**Acción:** 
1. Descarga el reporte de errores
2. Corrige los registros fallidos
3. Importa solo los datos corregidos

#### 🔄 "No se encontraron usuarios válidos"
**Qué pasó:** Todos los usuarios en el CSV tienen errores
**Acción:**
1. Verifica formato CSV (separado por comas, UTF-8)
2. Verifica que la fila de encabezado coincida exactamente con la plantilla
3. Asegúrate de que los campos requeridos estén llenos

---

## Mejores Prácticas

### 🎯 Consejos de Preparación
1. **Empieza pequeño:** Prueba con 5-10 empleados primero
2. **Datos limpios:** Elimina caracteres especiales de nombres/nombres de usuario
3. **Formato consistente:** Usa los mismos formatos de fecha/texto en todo
4. **Respaldo:** Mantén seguros los archivos de datos originales

### 🔐 Mejores Prácticas de Seguridad
1. **Contraseñas fuertes:** Los usuarios de oficina necesitan contraseñas complejas
2. **IDs únicos:** Asegúrate de que personID y employeeId sean únicos
3. **Privacidad de datos:** No compartas archivos CSV con datos sensibles
4. **Limpieza:** Elimina archivos CSV después de importación exitosa

### 📊 Consejos de Organización
1. **Agrupar por departamento:** Importa departamento por departamento
2. **Gerentes primero:** Importa gerentes antes que sus empleados
3. **Orden lógico:** Sigue la jerarquía organizacional

### ✅ Control de Calidad
1. **Verificar ortografía:** Nombres, emails, departamentos
2. **Verificar jerarquía:** Las relaciones de gerencia tienen sentido
3. **Probar logins:** Después de importar, prueba algunos logins de usuario
4. **Revisar reportes:** Siempre revisa los resultados de importación

---

## Preguntas Frecuentes

### Preguntas Generales

**P: ¿Cuántos empleados puedo importar a la vez?**
R: Hasta 10,000 empleados por archivo CSV (límite de 10MB). Para organizaciones más grandes, divide en múltiples archivos.

**P: ¿Puedo actualizar empleados existentes?**
R: ¡Sí! El sistema actualizará empleados existentes basado en coincidencias de personID o employeeId.

**P: ¿Qué pasa si cometo un error?**
R: Puedes usar la función "Rollback" en el Historial de Importaciones para deshacer importaciones recientes.

### Preguntas Técnicas

**P: Mi CSV tiene columnas extra. ¿Está bien?**
R: Las columnas extra serán ignoradas. Solo asegúrate de que las columnas requeridas estén presentes en el orden correcto.

**P: ¿Puedo dejar algunos campos vacíos?**
R: Sí, pero los campos requeridos (name, role, personID) deben estar llenos. Los campos de autenticación dependen del userType.

**P: ¿Cómo manejo empleados sin gerentes?**
R: Deja managerPersonID y managerEmployeeId vacíos para empleados de nivel superior.

### Preguntas de Autenticación

**P: ¿Cuál es la diferencia entre usuarios de oficina y operativos?**
R: Los usuarios de oficina tienen acceso a email y usan contraseñas complejas. Los usuarios operativos usan PINs simples y pueden no tener email.

**P: ¿Puede un empleado tener tanto email como nombre de usuario?**
R: ¡Sí! Tener ambos proporciona flexibilidad de login.

**P: ¿Qué tan seguras son las contraseñas en el CSV?**
R: Las contraseñas son automáticamente hasheadas cuando se importan y nunca se almacenan como texto plano en la base de datos.

---

## Soporte

### ¿Necesitas Más Ayuda?

**📧 Contactar Soporte:**
- Email: soporte@empresa.com
- Mesa de Ayuda Interna: Extensión 1234

**📚 Recursos Adicionales:**
- Documentación de Gestión de Usuarios
- Guía de Administración del Sistema
- Tutoriales en Video (Portal Interno)

**🆘 Soporte de Emergencia:**
- Para problemas críticos de importación durante horas de trabajo
- Teléfono: +1-555-0123
- Escalación: Gerente de TI

---

*Última actualización: [Fecha Actual]*
*Versión: 1.0*
*Para Sistema de Gestión de Desempeño v2024*

---

## Apéndice: Referencia de Plantilla

### Encabezado Completo de Plantilla
```csv
name,email,username,role,department,userType,employeeId,personID,managerPersonID,managerEmployeeId,position,shift,password
```

### Archivo Completo de Muestra
```csv
name,email,username,role,department,userType,employeeId,personID,managerPersonID,managerEmployeeId,position,shift,password
Juan Pérez,juan.perez@empresa.com,jperez,employee,Ingeniería,office,EMP001,PID001,PID002,EMP002,Ingeniero de Software,Día,Contraseña123!
María López,maria.lopez@empresa.com,mlopez,manager,Ingeniería,office,EMP002,PID002,,,Gerente de Ingeniería,Día,Contraseña123!
Carlos Trabajador,,ctrabajador,employee,Producción,operational,EMP003,PID003,PID002,EMP002,Operario,Mañana,1234
```

¡Esta guía completa cubre todo lo que tus usuarios necesitan saber para importaciones CSV exitosas!
//var url_server = 'http://159.203.128.165:8080/';
//var url_server = 'http://127.0.0.1:8080/';
var url_server = 'http://192.168.0.103:8080/';
var socket = io.connect(url_server);

/* Controlador para secretario */
var app = angular.module('secreto', [])

$(document).on("click","#dependencias", function(){
    $("#inv").openModal()// Abrimos la ventana
});
$(document).on("click","#entregablebtn", function(){
    $("#entregable").openModal()// Abrimos la ventana
});


app.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;

            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);

app.service('fileUpload', ['$http', function ($http) {

    this.uploadFileToUrl = function(nombre, file, acuerdo, uploadUrl){
      console.log("Que onda");
        var fd = new FormData();
        fd.append('photo', file);
        fd.append('nombre', nombre)
        $http.post(uploadUrl, fd, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
        })
        .success(function(response){
            if(response.type){
                acuerdo.id = acuerdo._id; // Pasamos la _id a id para mayor comodidad del lado del servidor a manejar el dato.
                delete acuerdo._id
                acuerdo.ACUSTA = 'Terminada';
                acuerdo.url_file = response.ruta;
                $http.put(url_server+"acuerdo/actualizar", acuerdo).success(function(response) {
                    $("#mensaje").empty();
                    $("#mensaje").append('<div class="chip col s12 m12 l12">Acuerdo finalizado. <i class="material-icons">Cerrar</i></div>');
                    $("#mensaje").css('color', '#FFF');
                    location.reload();
                })
                //$("#mensaje").html("Se ha subido el archivo <a href='empleado.html'>Volver</a>")
            }
            else
                $("#mensaje").html("Ocurrio un error al subir el archivo")
        })
        .error(function(){
            $("#mensaje").html("Ocurrio un error al subir el archivo")
        });
    }
}]);

app.controller('directivoController', ['$scope', '$http', 'fileUpload', function($scope, $http, fileUpload){
	var usuario = localStorage.getItem("usuario")
	var empresa = localStorage.getItem("empresa")
	$scope.usuario = JSON.parse(usuario);
  console.log("Este es el usuario"+localStorage.getItem("usuario"));
	$scope.acuerdos = {}
	$scope.personas = {}
	$scope.tarea = {}

	/* Obtenemos los parametros de la url */
    var edit = getUrlParameter('id');
    /* Llamamos a la función para obtener la lista de usuario al cargar la pantalla */
    if (edit == undefined) {
        total_acuerdos();
		//getEmpleados();
    }else{
        getAcuerdoUnico();
        getEmpleados();
    }
    get_cumpleanos()
	/* Obtenemos a todos los empleados */
	function getEmpleados() {
		$http.get(url_server+"user/usuario/3/"+empresa).success(function(response) {
	        if(response.type) { // Si nos devuelve un OK la API...
	        	$scope.personas = response.data;
	        }
	    });
	}

	$scope.entregable = function(filename, file) {
        if(filename == '' || file == undefined){
            $("#mensaje").html("Por favor seleccione el archivo y nombre.")
        }
        console.log("Entra en entegable");
        var uploadUrl = url_server+"guardar";
        fileUpload.uploadFileToUrl(filename, file, $scope.acuerdo, uploadUrl);
    }/*
       function alertDismissed() {
            // do something
        }
    // Alerta de nueva junta
    function nuevaJuntaAlert() {
    	navigator.notification.beep(3);
        navigator.notification.alert(
            'Has sido invitado a una junta!',  // message
            alertDismissed,         // callback
            'Nueva junta',            // title
            'Aceptar'                  // buttonName
        );
    }
    // Alerta de nueva junta
    function nuevoAcuerdoAlert() {
    	navigator.notification.beep(3);
        navigator.notification.alert(
            'Se te ha asignado un acuerdo!',  // message
            alertDismissed,         // callback
            'Nueva junta',            // title
            'Aceptar'                  // buttonName
        );
    }*/
	/* Método para obtener información de un acuerdo específico */
    function getAcuerdoUnico() {
        $http.get(url_server+"acuerdo/find/"+edit).success(function(response) {
            if(response.type) { // Si nos devuelve un OK la API...
                $scope.acuerdo = response.data[0];
                if ($scope.acuerdo.url_file) {
                    var params = $scope.acuerdo.url_file.split('/')
                    var type = params[params.length-1].split('.')
    				if (type[type.length-1] == 'pdf') {
    				    $scope.type_file = 'pdf'
    				}else{
    				    $scope.type_file = 'img'
    				}
                }
                today = get_today()
                var dias_diferencias = restaFechas(today, response.data[0].ACUTIM)
				if (dias_diferencias == 0) {
					$scope.dias_para_junta = "Hoy es el día límite para cumplir con este acuerdo."
				}else if (dias_diferencias == 1) {
					$scope.dias_para_junta = "Mañana es el día límite para cumplir con este acuerdo."
				}else if (dias_diferencias > 0) {
					$scope.dias_para_junta = "Faltan "+dias_diferencias+" días para cumplir con este acuerdo."
				}else if (dias_diferencias < 0) {
					$scope.dias_para_junta = "La fecha límite para cumplir con este acuerdo fue hace "+Math.abs(dias_diferencias)+" días"
				};
				getTareas($scope.acuerdo._id)
				if ($scope.acuerdo.ACUSTA == 'Terminada') {
                    var url = $scope.acuerdo.url_file.substring(2)
                    $scope.url_final = url_server+url;
                };
                //lastUsuarioAcuerdo = $scope.acuerdo.ACUCPE
            }
        });
    }

                function playBeep() {
                    navigator.notification.beep(1);
                }

                // Vibrate for 2 seconds
                //
                function vibrate() {
                    navigator.notification.vibrate(2000);
                }
	/* Funcion de escucha ante un nuevo acuerdo */
	socket.on("nuevo_acuerdo", function (data) {
        playBeep()
        vibrate()
		//alert("nuevo "+data.ACUDES);
		var myName = $("#nombre_usuario").val();
		if (myName == data.ACUCPE) {
			var numNotificaciones = parseInt($(".noti2").text())
			numNotificaciones++;
			$(".noti2").html(numNotificaciones)
			$("#noti2").html(numNotificaciones)
			$("#nothing2").empty();
			var htmlText = '<li><a href="acuerdo.html?id='+data._id+'"><i class="mdi-social-notifications"></i> '+data.ACUDES+'</a></li>'
			$("#notifications-dropdown-acuerdos").append(htmlText);
			Materialize.toast('Nuevo acuerdo asignado!', 4000)
			total_acuerdos();
			/*$http.get(url_server+"acuerdo/buscar/"+myName+"/"+empresa).success(function(response) {
		        if(response.type) { // Si nos devuelve un OK la API...
		        	total_acuerdos();
		        }
		    });*/
		};
	});

	/* Funcion de escucha ante una nueva junta */
	socket.on("nueva_junta", function (idj, motivo, id) {
        playBeep()
        vibrate()
		var myName = $("#nombre_usuario").val();
		if (myName == id) {
			var numNotificaciones = parseInt($(".noti").text())
			numNotificaciones++;
			$(".noti").html(numNotificaciones)
			$("#noti").html(numNotificaciones)
			$("#nothing").empty();
			var htmlText = '<li><a href="junta.html?id='+idj+'"><i class="mdi-social-notifications"></i> '+motivo+'</a></li>'
			$("#notifications-dropdown").append(htmlText);
			Materialize.toast('Nueva junta de trabajo!', 4000)
			total_juntas()
			/*$http.get(url_server+"acuerdo/buscar/"+myName+"/"+empresa).success(function(response) {
		        if(response.type) { // Si nos devuelve un OK la API...
		        	total_acuerdos();
		        }
		    });*/
		};
	});

	/* Metodo para obtener la cantidad de acuerdos del usuario */
	function total_acuerdos(){
		var user = JSON.parse(usuario)
		var myName = user._id;
		$http.get(url_server+"acuerdo/buscar/"+myName).success(function(response) {
			if(response.type) { // Si nos devuelve un OK la API...
		        $scope.acuerdos = response.data;
		        var total_acuerdos = response.data.length;
		        $("#num-notifications").html(total_acuerdos);
		        total_juntas();
		    }
		});
	}

	/* Metodo para obtener la cantidad de juntas del usuario */
	function total_juntas(){
		var user = JSON.parse(usuario)
		var myName = user._id;
		$http.get(url_server+"junta/buscar/"+myName).success(function(response) {
			if(response.type) { // Si nos devuelve un OK la API...
		        $scope.juntas = response.data;
		        var total_acuerdos = response.data.length;
		        var total = total_acuerdos + parseInt($("#num-notifications").text())
		        $("#num-notifications").html(total_acuerdos);
		        //get_fecha_juntas()
		        //get_fecha_acuerdos()
		    }
		});
	}

	$scope.checkedDependencias = [];
    $scope.checkedIdEmp = [];
    $scope.checkedClave = [];
	//funcion que captura a las dependencias de tareas que selecciona para las juntas
        $scope.addDependencia = function(id,clave,descripcion) {
            //alert("idEmp "+id+" empleado "+empleado);
            var index = $scope.checkedDependencias.indexOf(descripcion);
            var indexID = $scope.checkedIdEmp.indexOf(id);
            var indexPuesto = $scope.checkedClave.indexOf(clave);

            if ( index != -1 ) {//ya esta agregado
                $scope.checkedDependencias.splice(index,1);
            }else{
                $scope.checkedDependencias.push(descripcion);
            }

            if ( indexID != -1 ) {//ya esta agregado
                $scope.checkedIdEmp.splice(indexID,1);
                $scope.checkedClave.splice(indexPuesto,1);
            }else{
                $scope.checkedIdEmp.push(id);
                $scope.checkedClave.push(clave);
            }
        };

	/* Método para agregar una tarea */
    $scope.nuevaTarea = function(acuerdo){
    	$scope.tarea.empresa = empresa;
    	$scope.tarea.acuerdo = acuerdo;
    	$scope.tarea.dependencias = $scope.checkedIdEmp;
    	$scope.tarea.dependencias_des = $scope.checkedDependencias;
    	$scope.tarea.ACUSTA = 'No iniciada'

    	$http.post(url_server+"tarea/crear", $scope.tarea).success(function(response) {
            if(response.status === "OK") { // Si nos devuelve un OK la API...
            	socket.emit("nueva_tarea", response.data);
            	$("#mensaje").empty();
                $("#mensaje").append('<div class="chip">Tarea creada<i class="material-icons">Cerrar</i></div>');
                $("#mensaje").css('color', '#FFF');
                $(".card-reveal").fadeOut()
                $scope.tarea = {}; // Limpiamos el scope
                getTareas(response.data.acuerdo)
                /*$("#error").empty();
                $("#error").append("<div class='green center-align'><i class='mdi-action-thumb-up'></i> Tarea creada satisfactoriamente.</div>");
                $("#error").css('color', '#FFF');
                $("#error").fadeIn()*/
            }
        });
    }
    $scope.limpiar = function(){
    	$scope.checkedDependencias = [];
	    $scope.checkedIdEmp = [];
	    $scope.checkedClave = [];
    }

    /* Método para obtener las tareas */
    function getTareas(acuerdo){
    	$scope.bloqueado = "true";
    	$scope.tarea.empresa = empresa;
        alert(empresa)
    	$http.get(url_server+"tarea/listar/"+acuerdo+"/"+empresa).success(function(response) {
            if(response.status === "OK") { // Si nos devuelve un OK la API...
            	$scope.tareas = response.data;
            	for (var i=0;i<$scope.tareas.length;i++){
                    var dep = $scope.tareas[i].ACUSTA;
                    if ($scope.bloqueado == "true" && (tarea_dep.ACUSTA == 'No iniciada' || tarea_dep.ACUSTA == 'En progreso') ) {
                    	$scope.bloqueado = "false";
                    };
                    alert($scope.bloqueado)
                }
            }
        });
    }

    function getUrlParameter(sParam) {
        var sPageURL = decodeURIComponent(window.location.search.substring(1)),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;

        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');

            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : sParameterName[1];
            }
        }
    };

    // Cada 8 horas verificamos si hay alguna junta proxima
	var fecha_juntas = setInterval(get_fecha_juntas, 3600000);
	var fecha_acuerdos = setInterval(get_fecha_acuerdos, 3600000);
	var fecha_cumple = setInterval(get_cumpleanos, 3600000);

	// Función para determinar cuantos dias faltan para las juntas
	function get_fecha_juntas(){
	    var today = get_today()
		for (var i=0; i<$scope.juntas.length;i++){
			// Obtenemos los dias de diferencia
			var dias_diferencias = restaFechas(today, $scope.juntas[i].JUTFEC)
			if (dias_diferencias == 0) {
				Materialize.toast("<a href='junta.html?id="+$scope.juntas[i]._id+"'>Hola "+$scope.usuario.nombreC+", hoy se llevará acabo la junta "+$scope.juntas[i].JUTCVE+" a la cual fuiste invitado, se llevará acabo en "+$scope.juntas[i].JUTLUG+" a las "+$scope.juntas[i].JUTHOR+" hrs.</a>", 10000)
                playBeep()
        vibrate()
			}else if (dias_diferencias == 1) {
				Materialize.toast("<a href='junta.html?id="+$scope.juntas[i]._id+"'>Hola "+$scope.usuario.nombreC+", mañana se llevará acabo la junta "+$scope.juntas[i].JUTCVE+" a la cual fuiste invitado, se llevará acabo en "+$scope.juntas[i].JUTLUG+" a las "+$scope.juntas[i].JUTHOR+" hrs.</a>", 10000)
                playBeep()
        vibrate()
			}else if (dias_diferencias < 3 && dias_diferencias > 0) {
				Materialize.toast("<a href='junta.html?id="+$scope.juntas[i]._id+"'>Hola "+$scope.usuario.nombreC+", te recordamos que tienes una junta en "+dias_diferencias+" dias, la junta es "+$scope.juntas[i].JUTCVE+" y se llevará acabo en "+$scope.juntas[i].JUTLUG+"</a>", 4000)
                playBeep()
        vibrate()
			};
		}
	}

	// Función para determinar que cuantos dias faltan para que el directivo cumpla con un acuerdo
	function get_fecha_acuerdos(){
	    var today = get_today()
		for (var i=0; i<$scope.acuerdos.length;i++){
			// Obtenemos los dias de diferencia
			var dias_diferencias = restaFechas(today, $scope.acuerdos[i].ACUTIM)
			if (dias_diferencias == 0) {
				Materialize.toast("<a href='acuerdo.html?id="+$scope.acuerdos[i]._id+"'>Hola "+$scope.usuario.nombreC+", hoy es el día limite para cumplir con el acuerdo "+$scope.acuerdos[i].ACUNAC+" que te fue asignado.</a>", 10000)
                playBeep()
        vibrate()
			}else if (dias_diferencias == 1) {
				Materialize.toast("<a href='acuerdo.html?id="+$scope.acuerdos[i]._id+"'>Hola "+$scope.usuario.nombreC+", mañana es el día limite para cumplir con el acuerdo "+$scope.acuerdos[i].ACUNAC+" que te fue asignado.</a>", 10000)
                playBeep()
        vibrate()
			}else if (dias_diferencias < 3 && dias_diferencias > 0) {
				Materialize.toast("<a href='acuerdo.html?id="+$scope.acuerdos[i]._id+"'>Hola "+$scope.usuario.nombreC+", faltan "+dias_diferencias+" dias para cumplir con el acuerdo "+$scope.acuerdos[i].ACUNAC+" que te fue asignado.</a>", 10000)
                playBeep()
        vibrate()
			};
		}
	}

	// funcion para saber la fecha de cumpleaños del empleado
	function get_cumpleanos(){
		var today = get_today()
		var dias_diferencias = restaFechas(today, $scope.usuario.fecha_nac)
		if (dias_diferencias == 0) {
			$("#mensaje_cumple").html($scope.usuario.nombreC+" Felicidades hoy en tu cumpleaños!")
			$("#mensaje_cumple").addClass('card')
		};
	}

	// Funcion que obtiene la diferencia de dos fechas en dias
	function restaFechas(f1,f2){
		/*var aFecha1 = f1.split('/');
		var aFecha2 = f2.split('/');
		var fFecha1 = Date.UTC(aFecha1[2],aFecha1[1]-1,aFecha1[0]);
		var fFecha2 = Date.UTC(aFecha2[2],aFecha2[1]-1,aFecha2[0]);
		var dif = fFecha2 - fFecha1;
		var dias = Math.floor(dif / (1000 * 60 * 60 * 24));
		return dias;*/
	}

	function get_today(){
		// Obtenemos la fecha de hoy con el formato dd/mm/yyyy
		var today = new Date()
		var dd = today.getDate();
    	var mm = today.getMonth()+1; //January is 0!
		var yyyy = today.getFullYear();
    	if(dd<10){
        	dd='0'+dd
    	}
	    if(mm<10){
	        mm='0'+mm
	    }
	    var today = dd+'/'+mm+'/'+yyyy;
	    return today;
	}
}]);

var url_server = 'http://192.168.0.103:8080/';
//var url_server = 'http://159.203.128.165:8080/';
//var url_server = 'http://127.0.0.1:8080/';
//var socket = io.connect(url_server);

/* Controlador para secretario */
var app = angular.module('secreto', [])

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


    this.uploadFileToUrl = function(nombre, file, tarea, uploadUrl){
console.log("Que le pasaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        var fd = new FormData();

        fd.append('photo', file);
        fd.append('nombre', nombre)
        $http.post(uploadUrl, fd, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
        })
        .success(function(response){
            if(response.type){
                tarea.id = tarea._id; // Pasamos la _id a id para mayor comodidad del lado del servidor a manejar el dato.
                delete tarea._id
                tarea.ACUSTA = 'Terminada';
                tarea.url_file = response.ruta;
                $http.put(url_server+"tarea/actualizar", tarea).success(function(response) {
                    $("#mensaje").empty();
                    $("#mensaje").append('<div class="chip col s12 m12 l12">Tarea finalizada. <i class="material-icons">Cerrar</i></div>');
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

app.controller('empleadoController', ['$scope', '$http', 'fileUpload', function($scope, $http, fileUpload){
	var usuario = localStorage.getItem("usuario")
	var empresa = localStorage.getItem("empresa")
	$scope.usuario = JSON.parse(usuario);
	$scope.tareas = {}
	$scope.personas = {}

	var edit = getUrlParameter('id');
	/* Llamamos a la función para obtener la lista de usuario al cargar la pantalla */
    if (edit == undefined) {
        total_tareas();
    }else{
        getTareaUnico();
    }
	get_cumpleanos()
    // funcion para saber la fecha de cumpleaños del empleado
    function get_cumpleanos(){
        var today = get_today()
        var dias_diferencias = restaFechas(today, $scope.usuario.fecha_nac)
        if (dias_diferencias == 0) {
            $("#mensaje_cumple").html($scope.usuario.nombreC+" Felicidades hoy en tu cumpleaños!")
            $("#mensaje_cumple").addClass('card')
        };
    }
    /* Método para actualizar un usuario */
    $scope.updateUsuario = function() {
        var usuario = $scope.usuario;
        $('#'+usuario._id+"-Update").closeModal();
        usuario.id = usuario._id; // Pasamos la _id a id para mayor comodidad del lado del servidor a manejar el dato.
        //delete usuario._id; // Lo borramos para evitar posibles intentos de modificación de un ID en la base de datos
        // Hacemos una petición PUT para hacer el update a un documento de la base de datos.
        var nombre_puesto = $("#puesto_empleado_update-"+usuario.id+" option:selected").text();
        usuario.puesto_nombre = nombre_puesto;
        $http.put(url_server+"user/actualizar", usuario).success(function(response) {
            if(response.status === "OK") {
                localStorage.usuario = JSON.stringify(usuario);
                $("#mensaje").empty();
                $("#mensaje").append('<div class="chip">Información actualizada <i class="material-icons">Cerrar</i></div>');
                $("#mensaje").css('color', '#FFF');
            }
        });
    }
                function playBeep() {
                    navigator.notification.beep(3);
                }

                // Vibrate for 2 seconds
                //
                function vibrate() {
                    navigator.notification.vibrate(2000);
                }
	/* Funcion de escucha ante un nuevo acuerdo */
	/*socket.on("nueva_tarea", function (data) {
        playBeep()
        vibrate()
		var user = JSON.parse(usuario)
		var myName = user._id;
		if (myName == data.ACUCPE) {
			var numNotificaciones = parseInt($(".noti").text())
			numNotificaciones++;
			$(".noti").html(numNotificaciones)
			$("#noti").html(numNotificaciones)
			$("#nothing").empty();
			var htmlText = '<li><a href="tarea.html?id='+data._id+'"><i class="mdi-social-notifications"></i> '+data.ACUDES+'</a></li>'
			$("#notifications-dropdown").append(htmlText);
			Materialize.toast('Nueva tarea asignada!', 4000)
			$http.get(url_server+"tarea/buscar/"+myName).success(function(response) {
		        if(response.type) { // Si nos devuelve un OK la API...
		        	total_tareas();
		        }
		    });
		};
	});*/
	/* Metodo para obtener la cantidad de acuerdos del usuario */
	function total_tareas(){
		var user = JSON.parse(usuario)
		var myName = user._id;
		$http.get(url_server+"tarea/buscar/"+myName).success(function(response) {
			if(response.type) { // Si nos devuelve un OK la API...
		        $scope.tareas = response.data;
		        /*var total_acuerdos = response.data.length;
		        $("#num-notifications").html(total_acuerdos);*/
		    }
		})
	}

	/* Método para agregar una tarea */
    $scope.nuevoAcuerdo = function(){
    	$http.post(url_server+"tarea/crear", $scope.tarea).success(function(response) {
            if(response.status === "OK") { // Si nos devuelve un OK la API...
            	socket.emit("nueva_tarea", response.data);
                $scope.tarea = {}; // Limpiamos el scope
                $("#error").empty();
                $("#error").append("<div class='green center-align'><i class='mdi-action-thumb-up'></i> Tarea creada satisfactoriamente.</div>");
                $("#error").css('color', '#FFF');
                $("#error").fadeIn()
            }
        });
    }

    $scope.entregable = function(filename, file) {
      console.log("No hace nada jejejej");
        if(filename == '' || file == undefined){
            $("#mensaje").html("Por favor seleccione el archivo y nombre.")
        }
        var uploadUrl = url_server+"guardar";
          fileUpload.uploadFileToUrl(filename, file, $scope.tarea, uploadUrl);
    }
    /* Método para obtener información de una tarea específica */
    function getTareaUnico() {
        $scope.bloqueado = "true";
        $http.get(url_server+"tarea/find/"+edit).success(function(response) {
            if(response.type) { // Si nos devuelve un OK la API...
                $scope.tarea = response.data[0];
                $scope.dependencias = []
                // Comprobamos el estado de las dependencias en caso de existir
                for (var i=0;i<$scope.tarea.dependencias.length;i++){
                    var dep = $scope.tarea.dependencias[i]
                    $http.get(url_server+"tarea/find/"+dep).success(function(response) {
                        if(response.type) { // Si nos devuelve un OK la API...
                            var tarea_dep = response.data[0];
                            $scope.dependencias.push(tarea_dep);
                            if ($scope.bloqueado == "true" && (tarea_dep.ACUSTA == 'No iniciada' || tarea_dep.ACUSTA == 'En progreso') ) {
                                $scope.bloqueado = "false";
                            };
                        }
                    });
                }
                var params = $scope.tarea.url_file.split('/')
                var type = params[params.length-1].split('.')
                if (type[type.length-1] == 'pdf') {
                    $scope.type_file = 'pdf'
                }else{
                    $scope.type_file = 'img'
                }
                if ($scope.tarea.ACUSTA == 'Terminada') {
                    var url = $scope.tarea.url_file.substring(2)
                    $scope.url_final = url_server+url;
                };
            }
        });
    }

    // Método para iniciar una tarea
    $scope.iniciar = function(){
        var tarea = $scope.tarea
        tarea.id = tarea._id; // Pasamos la _id a id para mayor comodidad del lado del servidor a manejar el dato.
        delete tarea._id
        tarea.ACUSTA = 'En progreso';
        $http.put(url_server+"tarea/actualizar", tarea).success(function(response) {
            $("#mensaje").empty();
            $("#mensaje").append('<div class="chip col s12 m12 l12">Información actualizada <i class="material-icons">Cerrar</i></div>');
            $("#mensaje").css('color', '#FFF');
            getTareaUnico(response.data._id)
        })
    }
    /* Método para obtener información de un usuario específico */
    function getUsuarioUnico() {
        $http.get(url_server+"user/buscar/"+edit).success(function(response) {
            if(response.type) { // Si nos devuelve un OK la API...
                $scope.usuario = response.data[0];
                localStorage.getItem("usuario") = JSON.stringify(response.data[0])
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

console.log('fn112233')
let body = document.getElementsByTagName('body')
body.appendChild('<img src="../img/test.jpg">')

function test(){
	console.log('remote test')
}

loadScript = (url,callback) =>{
	let script = document.createElement('script')
	script.type = 'text/javascript'
	script.onload = script.onreadystatechange = function() {
		if (!this.readyState || this.readyState === "loaded" || this.readyState === "complete" ) {
			callback();
			script.onload = script.onreadystatechange = null;
		}
	}
	script.src= url
	document.appendChild(script)
}
loadScript('http://localhost:8001/js/fn.js',function () {
	console.log(window.obj)
})

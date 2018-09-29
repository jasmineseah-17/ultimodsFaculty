window.onload = function(){
		// JASMINE: i got the table to display, when a 2D array is passed in
	// format: [ [x,y], [a,b] ] --> ready data array at this.FStudentList
	// missing: choose an appropriate place to insert. Currently insert by Id...
	// missing: borders.
	function createTable(tableData) {
		var table = document.createElement('table');
		var tableBody = document.createElement('tbody');
  
  
		tableData.forEach(function(rowData) {
		  var row = document.createElement('tr');
  
		  rowData.forEach(function(cellData) {
			var cell = document.createElement('td');
			cell.appendChild(document.createTextNode(cellData));
			row.appendChild(cell);
		  });
  
		  tableBody.appendChild(row);
		});
  
		table.appendChild(tableBody);
		//document.body.appendChild(table);
		//document.body.insertBefore( table, document.getElementsByTagName('p')[0]);
		document.body.insertBefore( table, document.getElementsByClassName('lake'));
	  }
	  
  
	var app = new Vue({
		el:"#app",
		data: {
			modulesCourses: {},
			modulesYearOfStudy: {},
			inputModCode: '',

			studentsMods: {}, // {token:mod_code}
			studentsCAP: {}, // {token: CAP}
			CAPlistperMod: {}, // 
			degreeClassification_Count: {},
			degreeClassification_StuList: {},
			inputToken: '',

			module_code: [],
			modules: {},
			gradesClassification:{},
			inputModCodeAcad: '',
			FStudentList: [],
            
            module_name: "",
			preReq: {'CS2010': ['CS1010', 'CS1020'], 'CS2100': ['CS1010','MKT1003']},

			loaded: false,
            loadedMockup: false, 
            loadedEnrolment: false, 
			mockupUrl: 'https://bt3103-mockup.firebaseio.com/.json',
			enrolmentUrl: 'https://alset-md.firebaseio.com/nusSynData/module_enrolment.json'
		},
		mounted: function () { //Will start at zero if you don't update on init
            
            var context = this;
			
			//this.loaded = true
            this.update(this.mockupUrl)
                .then((data)=>{
                    context.modulesCourses =  context.featureCourses(data);
                    context.modulesYearOfStudy = context.featureYearOfStudy(data);
                    context.loadedMockup = true;
                    context.loaded = context.loadedMockup && context.loadedEnrolment;
                })
            
            this.update(this.enrolmentUrl)
                .then((data)=>{
                    context.studentsCAP = context.featureCAP(data);
                    context.modules = context.featurePreReqGrades(data);
                    console.log(context.modules)
                    context.loadedEnrolment = true;
                    context.loaded = context.loadedMockup && context.loadedEnrolment;
					this.retrieveTokenMod(this.module_name)
					this.findFstudents(this.module_name)
					//createTable(this.FStudentList)
                })
            
            //this.retrieveTokenMod(this.module_name.toUpperCase())
            console.log('count', this.degreeClassification_Count)
        },
        created() {
            let url = new URL(window.location.href);
            this.module_name = url.searchParams.get('module_name');
        },
        

		methods:{
			
			update: function(URL) {
			  console.log('url log: ', URL)
			  return fetch(URL)
			  .then((response) => { 
                console.log('parsing')
			    return response.json(); }) 
			  .then((jsonData) => { 
			    //console.log("Updated remote counter", jsonData)
			    if(jsonData) {
			    	return jsonData
			     }             
			  })		

			},
			featureCAP: function(jsonData) {
				const grades = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "D+", "D", "F"]
				for (let key in jsonData){
				  if (grades.indexOf(jsonData[key].final_grade)>=0) {
				    //group all grades by modules
				    // {module_code:[final_grade]}
				    var mod_details = []
				    mod_details.push(jsonData[key].module_credits)
				    mod_details.push(jsonData[key].final_grade)
				    if (!this.studentsMods[jsonData[key].token]) {
				      this.studentsMods[jsonData[key].token] = {}
				    }
				    this.studentsMods[jsonData[key].token][jsonData[key].module_code] = mod_details
				    
				  }
				}
				return this.countAllCAP(this.studentsMods)
			},
			featureYearOfStudy: function(jsonData) {
				return this.countYear(jsonData)
			},
			featureCourses: function(jsonData) {
				return this.countCourse(jsonData)
			}, 
			featurePreReqGrades: function(jsonData) {
				var all_mods = {}
	            //const grades = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "D+", "D", "F"] 
	            const list = {'A+': [], 'A': [], 'A-': [], 'B+':[], 'B':[], 'B-':[], 'C+':[], 'C':[], 'D+':[], 'D':[], 'F':[]}

	            for (let key in jsonData){
	                if (jsonData[key].final_grade in list){
	                	if (!(jsonData[key].module_code in all_mods)) {
	                		all_mods[jsonData[key].module_code] = 
	                		{'count' : {'A+': 0, 'A': 0, 'A-': 0, 'B+':0, 'B':0, 'B-':0, 'C+':0, 'C':0, 'D+':0, 'D':0, 'F':0}, 
	                		'list' : {'A+': [], 'A': [], 'A-': [], 'B+':[], 'B':[], 'B-':[], 'C+':[], 'C':[], 'D+':[], 'D':[], 'F':[]}
	                		}
	                	}
                        all_mods[jsonData[key].module_code]['list'][jsonData[key].final_grade].push(jsonData[key].token)
                        all_mods[jsonData[key].module_code]['count'][jsonData[key].final_grade]++
	                    //group all grades by modules
	                    // {module_code:[final_grade]}
                  }
                }
                // count occurence of grades by modules
                // {module_code:{final_grade:num}}
                return all_mods
			},
	        countOccur: function(array, counts) {
	          for (var i = 0; i < array.length; i++) { 
	            var num = String(array[i]); 
	            counts[num] = counts[num] ? counts[num] + 1 : 1;
	                }
	          return counts
	        },
	        countAllOccur: function(obj){
	          var temp = {}
	          for (k in obj) {
	            temp[k] = this.countOccur(obj[k], {})
	           }
	          return temp
	        },
		    countCourse: function(jsonData) {
		        let moduleCounts = {};
		        for (var i = 0; i < jsonData.length; i++) {
					let item = jsonData[i];
	                if (!(item.module_code_json in moduleCounts)) {
	                        moduleCounts[item.module_code_json] = {'count': 0, 'courses': {}};
	                 }
					moduleCounts[item.module_code_json].count++;
					if (item.degrees.includes('Bachelor')){
	                if (!(item.degrees in moduleCounts[item.module_code_json].courses)) {
	                        moduleCounts[item.module_code_json].courses[item.degrees] = 1;
	                 } else {
	                        moduleCounts[item.module_code_json].courses[item.degrees]++;
					 }
					}
		        }
		     	return moduleCounts
		     },
		    countYear: function (jsonData){
		        let moduleCounts = {};
				for (var i = 0; i < jsonData.length; i++) {
						let item = jsonData[i];
						if (!(item.module_code_json in moduleCounts)) {
								moduleCounts[item.module_code_json] = {'count': 0, 'yearOfStudy': {'Year 1':0, 'Year 2': 0, 'Year 3':0, 'Year 4':0, 'Others':0}};
						 }
						const year = item.term_json - item.admit_term
						moduleCounts[item.module_code_json].count++;
						if (year < 200) {moduleCounts[item.module_code_json].yearOfStudy['Year 1']++}
						else if (year < 300) {moduleCounts[item.module_code_json].yearOfStudy['Year 2']++}
						else if (year < 400) {moduleCounts[item.module_code_json].yearOfStudy['Year 3']++}
						else if (year < 500) {moduleCounts[item.module_code_json].yearOfStudy['Year 4']++}
				}
				return moduleCounts
		    },
	        calculateCAP: function(stu_mods) {
	          const grades_dict = {"A+":5.0, "A":5.0, "A-":4.5, "B+":4.0, "B":3.5, "B-":3.0, "C+":2.5, "C":2.0, "D+":1.5, "D":1.0, "F":0}
	          var gradePoint_sum = 0
	          var creditPoint_sum = 0
	          for (mod in stu_mods) { 
	            gradePoint_sum += stu_mods[mod][0] * grades_dict[stu_mods[mod][1]]
	            creditPoint_sum += stu_mods[mod][0]
	            }
	          if (creditPoint_sum == 0 ) {return 0.00}
	          else {return (gradePoint_sum/creditPoint_sum).toFixed(2)}
	        },
	        countAllCAP: function(obj){
				var temp = {}
				for (stu_id in obj) {
					temp[stu_id] = this.calculateCAP(obj[stu_id])
				}
				return temp
	        },
	        retrieveTokenMod: function(mod_code){ 
	        	console.log('token received: ', mod_code)
				var CAPtokenpermod = {} // filter CAPs of students who take that mod
				const a = Object.keys(this.studentsMods) // student tokens
				for (var i = 0; i < a.length; i++) { 
					const b = Object.keys(this.studentsMods[a[i]]) // mod_codes student takes
					for (var j = 0; j < b.length; j++) { 
					  	if (b[j]===mod_code) {CAPtokenpermod[a[i]]= this.studentsCAP[a[i]]} 
					}

				}
				this.CAPlistperMod = CAPtokenpermod // {stu_token:CAP}
				console.log('caplist', this.CAPtokenpermod)
				var tempObj = this.degreeClassification(this.CAPlistperMod)
				console.log('hello' , tempObj)
				this.degreeClassification_Count = tempObj.count_dict
                this.degreeClassification_StuList = tempObj.stuToken_dict
	        },
	        degreeClassification: function(obj){
	            var count_dict = {'First': 0, 'Second Upper': 0, 'Second Lower': 0, 'Third':0, 'Pass':0, 'Fail':0}
	            var stuToken_dict = {'First': [], 'Second Upper': [], 'Second Lower': [], 'Third':[], 'Pass':[], 'Fail':[]}
	            var count = 0
	            console.log("degreeClassification", obj)
	            for (token in obj) {
					count += 1
					if (obj[token] >= 4.50) {count_dict['First'] += 1; stuToken_dict['First'].push(token)}
					else if (obj[token] >= 4.00) {count_dict['Second Upper'] += 1; stuToken_dict['Second Upper'].push(token)}
		            else if (obj[token] >= 3.50) {count_dict['Second Lower'] += 1; stuToken_dict['Second Lower'].push(token)}
		            else if (obj[token] >= 3.00) {count_dict['Third'] += 1; stuToken_dict['Third'].push(token)}
		            else if (obj[token] >= 2.00) {count_dict['Pass'] += 1; stuToken_dict['Pass'].push(token)}
					else {count_dict['Fail'] += 1; stuToken_dict['Fail'].push(token)}
	            }
	            for (classi in count_dict) {
	                    count_dict[classi] = (count_dict[classi]/count).toFixed(2)
	            }
	            return {count_dict, stuToken_dict}
			},
			dictToList: function(dict) {
	        	var grades = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "D+", "D", "F"] 
	        	var arr = []
	        	for (var i=0; i<grades.length; i++) {
	        		//console.log(grades[i])
	        		if (dict[grades[i]]) {arr.push([grades[i], dict[grades[i]]])}
	        	}
	        	return arr
	        },
	        findFstudents: function(mod_code) {
	        	var preReqMods = this.preReq[mod_code]
	        	var list = []
	        	console.log(this.modules["CS1020"]['list']['F'])
	        	for (var i=0; i<preReqMods.length; i++) {
	        		if (this.modules[preReqMods[i]]['list']['F'].length > 0) {
	        			list = list.concat([[preReqMods[i]].concat(this.modules[preReqMods[i]]['list']['F'])])
	        		} 
	        		
	        	}
	        	this.FStudentList = list
	        	//return list
	        }
		}
	})
}
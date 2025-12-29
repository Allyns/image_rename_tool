export namespace main {
	
	export class ImageItem {
	    id: number;
	    origPath: string;
	    origName: string;
	    prefix: string;
	    module: string;
	    featureName: string;
	    newName: string;
	
	    static createFrom(source: any = {}) {
	        return new ImageItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.origPath = source["origPath"];
	        this.origName = source["origName"];
	        this.prefix = source["prefix"];
	        this.module = source["module"];
	        this.featureName = source["featureName"];
	        this.newName = source["newName"];
	    }
	}
	export class NamingResult {
	    camelCase: string;
	    pascalCase: string;
	    snakeCase: string;
	    screamingCase: string;
	    packageCase: string;
	    kebabCase: string;
	
	    static createFrom(source: any = {}) {
	        return new NamingResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.camelCase = source["camelCase"];
	        this.pascalCase = source["pascalCase"];
	        this.snakeCase = source["snakeCase"];
	        this.screamingCase = source["screamingCase"];
	        this.packageCase = source["packageCase"];
	        this.kebabCase = source["kebabCase"];
	    }
	}

}


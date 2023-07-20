class APIFeatures{
    constructor(query, queryString){  // ** query (from moongose query) and queryString from the routes
        this.query = query;
        this.queryString = queryString;
    }
    filter(){
        // ! 1A) Filtering
        const queryObj = {...this.queryString};
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => {
            delete queryObj[el];
        });
        console.log(queryObj);
 
        // ! 1B) Advanced Filtering
        let queryStr = JSON.stringify(queryObj);  // { duration: { gte: '5' }, difficulty: 'easy' }
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
        this.query = this.query.find(JSON.parse(queryStr));

        return this;
    }
    sort(){
        // ! 2) SORTING // 127.0.0.1:8000/api/v1/tours?sort=-ratingsAverage,-price
        if(this.queryString.sort){
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        }else{
            // this.query = this.query.sort('createdAt'); // PAGINATION TIDAK BISA KALAU INI DIAKTIFKAN KARENA createdAt di non aktifkan
        }

        return this;
    }
    limitFields(){
        // ! 3) Field limitting  127.0.0.1:8000/api/v1/tours?fields=name,duration,difficulty,price
        if(this.queryString.fields){
            const fields = this.queryString.fields.split(',').join(' ');  // name duration price
            this.query = this.query.select(fields);
        }else{
            this.query = this.query.select('-__v'); // ('-__v -_id') Tidak memasukan fields __v dan _id pada tampilan
        }

        return this;
    }
    paginate(){
        // ! 4) PAGINATION page=2&limit=10
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}

module.exports = APIFeatures;
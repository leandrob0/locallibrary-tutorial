const mongoose = require("mongoose");
const { DateTime } = require("luxon");

const AuthorSchema = new mongoose.Schema({
  first_name: { type: String, required: true, maxLength: 100 },
  family_name: { type: String, required: true, maxLength: 100 },
  date_of_birth: { type: Date },
  date_of_death: { type: Date },
});

// Virtual for author's full name
AuthorSchema.virtual("name").get(function () {
  // To avoid errors in cases where an author does not have either a family name or first name
  // We want to make sure we handle the exception by returning an empty string for that case
  let fullname = "";
  if (this.first_name && this.family_name) {
    fullname = this.family_name + ", " + this.first_name;
  }
  if (!this.first_name || !this.family_name) {
    fullname = "";
  }
  return fullname;
});

// Virtual for author's lifespan
AuthorSchema.virtual("lifespan").get(function () {
  let lifetime_string = "";
  if (this.date_of_birth) {
    lifetime_string = this.due_back_formatted_birth;
  }
  lifetime_string += " - ";
  if (this.date_of_death) {
    lifetime_string += this.due_back_formatted_death;
  }
  return lifetime_string;
});

// Virtual for author's URL
AuthorSchema.virtual("url").get(function () {
  return "/catalog/author/" + this._id;
});

AuthorSchema.virtual("due_back_formatted_birth").get(function () {
  return this.date_of_birth
    ? DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED)
    : "";
});

AuthorSchema.virtual("due_back_formatted_death").get(function () {
  return this.date_of_death
    ? DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED)
    : "";
});

AuthorSchema.virtual("format_date_form_birth").get(function (){
  if(this.date_of_birth == undefined) return '';
  return this.date_of_birth.toISOString().split('T')[0]
})

AuthorSchema.virtual("format_date_form_death").get(() => {
  if(this.date_of_death == undefined) return '';
  return this.date_of_death.toISOString().split('T')[0]
})

// Export model
module.exports = mongoose.model("Author", AuthorSchema);

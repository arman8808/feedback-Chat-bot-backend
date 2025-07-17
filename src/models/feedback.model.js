import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

   
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },

 
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value'
      }
    },


    feedback: {
      type: String,
      trim: true,
      maxlength: 500
    },


    sessionId: {
      type: String,
      required: true,
      index: true
    },


    respondedAt: {
      type: Date,
      default: Date.now
    },

 
    metadata: {
      deviceType: String,
      browser: String,
      platform: String,
      ipAddress: String
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);


feedbackSchema.index({ user: 1, sessionId: 1 });
feedbackSchema.index({ question: 1, rating: 1 });


feedbackSchema.virtual('sentiment').get(function() {
  if (this.rating <= 2) return 'negative';
  if (this.rating >= 4) return 'positive';
  return 'neutral';
});


feedbackSchema.pre('save', function(next) {
  if (this.rating <= 2 && !this.feedback) {
    this.feedback = 'No feedback provided for low rating';
  }
  next();
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;
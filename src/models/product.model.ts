import mongoose, { Schema, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
export interface IProduct {
    name: string;
    productCode: string;
    description: string;
    customerId: mongoose.Types.ObjectId;
    customerProductCode: string;
    productCategoryId: mongoose.Types.ObjectId;
    hsnCode: string;
    pefilmbasiswidth: string; /////////////in mm
    pefilmmaxwidth: string; /////////////in mm
    rolllengthextruder: number; /////////////in meter
    rolllengthprinter: number; /////////////in meter
    numberofcoilsone: number;
    numberofcoilstwo: number;
    rolllengthlamination: number; /////////////in meter
    gluedetail: string;
    laminationType: string;
    rolllengthcoating: number; /////////////in meter
    finalcoillength: number; /////////////in meter
    papercorethicknessmin: number; /////////////in mm
    papercorethicknessstd: number; /////////////in mm
    papercorethicknessmax: number; /////////////in mm
    minrollod: number; /////////////in mm
    stdrollod: number; /////////////in mm
    maxrollod: number; /////////////in mm
    papercoreidmin: number; /////////////in mm
    papercoreidstd: number; /////////////in mm
    papercoreidmax: number; /////////////in mm
    jointsallowed: number; /////////////in nos
    palletspecification: string; /////////////in text
    rollsinpallet: number; /////////////in nos
    basisweightmin: number; /////////////in g/m2
    basisweightstd: number; /////////////in g/m2
    basisweightmax: number; /////////////in g/m2
    filmType: string; /////////////in text
    stretchratio: number; /////////////in percentage
    thickness: number; /////////////in mm
    thicknessMinValue: number; /////////////in mm
    thicknessMaxValue: number; /////////////in mm
    
    
    surfacetensionmin: number; /////////////in Dynes
    surfacetensionstd: number; /////////////in Dynes
    surfacetensionmax: number; /////////////in Dynes
    
    corona: string;
    embosstype: string;
    embossingside: string;
    printingside: string;
    opacity: string; /////////////in percentage
    gloss: string; /////////////in GU
    hydroheadpressure: string; /////////////in mBar
    wvtrmin: number; /////////////gsm/24hrs
    wvtrstd: number; /////////////gsm/24hrs
    wvtrmax: number; /////////////gsm/24hrs

    tensilestrengthpeakmdmin: number; /////////////in gf/inch
    tensilestrengthpeakmdstd: number; /////////////in gf/inch
    tensilestrengthpeakmdmax: number; /////////////in gf/inch
    tensilestrengthpeakcdmin: number; /////////////in gf/inch
    tensilestrengthpeakcdstd: number; /////////////in gf/inch
    tensilestrengthpeakcdmax: number; /////////////in gf/inch

    elongationpeakmdmin: number; /////////////in percentage
    elongationpeakmdstd: number; /////////////in percentage
    elongationpeakmdmax: number; /////////////in percentage
    elongationpeakcdmin: number; /////////////in percentage
    elongationpeakcdstd: number; /////////////in percentage
    elongationpeakcdmax: number; /////////////in percentage

    printingInkArr: {
        printingink: string;
        printinginkpantone: string;
    }[];
    repeatlengthwithouttensionmin:number;//in mm
    repeatlengthwithouttensionstd:number;//in mm
    repeatlengthwithouttensionmax:number;//in mm
    slevesize:number;
    printingdesignname:string;
    printingunwindingdirection:string;

    nonwovenbasisweightmin:string;
    nonwovenbasisweightstd:string;
    nonwovenbasisweightmax:string;


    thicknessmin:string;
    thicknessstd:string;
    thicknessmax:string;

    widthmin:string;
    widthstd:string;
    widthmax:string;

    length:number;///////in meter


    bondingtestmdmin: number; /////////////in gf/inch
    bondingtestmdstd: number; /////////////in gf/inch
    bondingtestmdmax: number; /////////////in gf/inch
    bondingtestcdmin: number; /////////////in gf/inch
    bondingtestcdstd: number; /////////////in gf/inch
    bondingtestcdmax: number; /////////////in gf/inch

    laminatedfilmbasisweightmin:number;
    laminatedfilmbasisweightstd:number;
    laminatedfilmbasisweightmax:number;



   laminationside:string;
   laminationtype:string;

  

   hydroheadpressuremin:number;
   hydroheadpressurestd:number;
   hydroheadpressuremax:number;
  
  


   laminationwidthstd: number; /////////////in mm
   laminationwidthmin: number; /////////////in mm
   laminationwidthmax: number; /////////////in mm

    slitWidth: number; /////////////in mm
    slitWidthMin: number; /////////////in mm
    slitWidthMax: number; /////////////in mm

    stdrollodmin: number; /////////////in mm
    stdrollodstd: number; /////////////in mm
    stdrollodmax: number; /////////////in mm

    stdrolllength: number; /////////////in meter

    corelengthstd: number; /////////////in mm
    corelengthmin: number; /////////////in mm
    corelengthmax: number; /////////////in mm

    shelflife: string;
    finalct: string;
    finalunwindingdirection: string;
    packingtapetype: string;
    connectiontype: string;
    halfjointconnection: number;
    noofconnectionrolls: number;

    // finalWidth: number; /////////////in mm
    // widthTolleranceMin: number; /////////////in mm
    // widthTolleranceMax: number; /////////////in mm
    // rollDiameter: number; /////////////in mm
    // rollDiameterMin: number; /////////////in mm
    // rollDiameterMax: number; /////////////in mm
    // noOfColors: number; /////////////in number
    // designName: string;
    // pantoneColors: string;
    // repeatLength: number; /////////////in mm
    // repeatLengthMin: number; /////////////in mm
    // repeatLengthMax: number; /////////////in mm
    // nonWowenBasisWeight: number;
    // finalPrintingDirection: string;
    // finalUnwindingDirection: string;
    // lengthOfRoll: number; /////////////in meter
    // coreDia: number; /////////////in mm

    stagesArr: {
        machineId: mongoose.Types.ObjectId;
        position: Number;
    }[];
    createdAt: Date;
    updateAt: Date;
}

// 2. Create a Schema corresponding to the document interface.
const productSchema = new Schema<IProduct>(
    {
        name: String,
        productCode: String,
        description: String,
        customerId: mongoose.Types.ObjectId,
        customerProductCode: String,
        productCategoryId: mongoose.Types.ObjectId,
        hsnCode: String,
        pefilmbasiswidth: String, /////////////in mm
        pefilmmaxwidth: String, /////////////in mm
        rolllengthextruder: Number, /////////////in meter
        rolllengthprinter: Number, /////////////in meter
        numberofcoilsone: Number,
        numberofcoilstwo: Number,
        rolllengthlamination: Number, /////////////in meter
        gluedetail: String,
        laminationType: String,
        rolllengthcoating: Number, /////////////in meter
        finalcoillength: Number, /////////////in meter
        papercorethicknessmin: Number, /////////////in mm
        papercorethicknessstd: Number, /////////////in mm
        papercorethicknessmax: Number, /////////////in mm
        minrollod: Number, /////////////in mm
        stdrollod: Number, /////////////in mm
        maxrollod: Number, /////////////in mm
        papercoreidmin: Number, /////////////in mm
        papercoreidstd: Number, /////////////in mm
        papercoreidmax: Number, /////////////in mm
        jointsallowed: Number, /////////////in nos
        palletspecification: String, /////////////in text
        rollsinpallet: Number, /////////////in nos
        basisweightmin: Number, /////////////in g/m2
        basisweightstd: Number, /////////////in g/m2
        basisweightmax: Number, /////////////in g/m2
        filmType: String, /////////////in text
        stretchratio: Number, /////////////in percentage
        thickness: Number, /////////////in mm
        thicknessMinValue: Number, /////////////in mm
        thicknessMaxValue: Number, /////////////in mm
        surfacetensionmin: Number, /////////////in Dynes
        surfacetensionstd: Number, /////////////in Dynes
        surfacetensionmax: Number, /////////////in Dynes
        corona: String,
        embosstype: String,
        embossingside: String,
        printingside: String,
        opacity: String, /////////////in percentage
        gloss: String, /////////////in GU
        hydroheadpressure: String, /////////////in mBar
        wvtrmin: Number, /////////////gsm/24hrs
        wvtrstd: Number, /////////////gsm/24hrs
        wvtrmax: Number, /////////////gsm/24hrs
        tensilestrengthpeakmdmin: Number, /////////////in gf/inch
        tensilestrengthpeakmdstd: Number, /////////////in gf/inch
        tensilestrengthpeakmdmax: Number, /////////////in gf/inch
        tensilestrengthpeakcdmin: Number, /////////////in gf/inch
        tensilestrengthpeakcdstd: Number, /////////////in gf/inch
        tensilestrengthpeakcdmax: Number, /////////////in gf/inch
        elongationpeakmdmin: Number, /////////////in percentage
        elongationpeakmdstd: Number, /////////////in percentage
        elongationpeakmdmax: Number, /////////////in percentage
        elongationpeakcdmin: Number, /////////////in percentage
        elongationpeakcdstd: Number, /////////////in percentage
        elongationpeakcdmax: Number, /////////////in percentage
        printingInkArr: [{
            printingink: String,
            printinginkpantone: String,
        }],
        repeatlengthwithouttensionmin:Number,//in mm
        repeatlengthwithouttensionstd:Number,//in mm
        repeatlengthwithouttensionmax:Number,//in mm
        slevesize:Number,
        printingdesignname:String,
        printingunwindingdirection:String,
        nonwovenbasisweightmin:String,
        nonwovenbasisweightstd:String,
        nonwovenbasisweightmax:String,
        thicknessmin:String,
        thicknessstd:String,
        thicknessmax:String,
        widthmin:String,
        widthstd:String,
        widthmax:String,
        length:Number,///////in meter
        bondingtestmdmin: Number, /////////////in gf/inch
        bondingtestmdstd: Number, /////////////in gf/inch
        bondingtestmdmax: Number, /////////////in gf/inch
        bondingtestcdmin: Number, /////////////in gf/inch
        bondingtestcdstd: Number, /////////////in gf/inch
        bondingtestcdmax: Number, /////////////in gf/inch
        laminatedfilmbasisweightmin:Number,
        laminatedfilmbasisweightstd:Number,
        laminatedfilmbasisweightmax:Number,
        laminationside:String,
        laminationtype:String,
        hydroheadpressuremin:Number,
        hydroheadpressurestd:Number,
        hydroheadpressuremax:Number,
        slitWidth: Number, /////////////in mm
        slitWidthMin: Number, /////////////in mm
        slitWidthMax: Number, /////////////in mm
        stdrollodstd: Number, /////////////in mm
        stdrollodmin: Number, /////////////in mm
        stdrollodmax: Number, /////////////in mm
        stdrolllength: Number, /////////////in meter
        corelengthstd: Number, /////////////in mm
        corelengthmin: Number, /////////////in mm
        corelengthmax: Number, /////////////in mm
        shelflife: String,
        finalct: String,
        finalunwindingdirection: String,
        packingtapetype: String,
        connectiontype: String,
        halfjointconnection: Number,
        noofconnectionrolls: Number,
        laminationwidthstd: Number, /////////////in mm
        laminationwidthmin: Number, /////////////in mm
        laminationwidthmax: Number, /////////////in mm
        stagesArr: [
            {
                machineId: mongoose.Types.ObjectId,
                position: Number,
            },
        ],
        // And `Schema.Types.ObjectId` in the schema definition.
    },
    { timestamps: true }
);

export const Product = model<IProduct>("Product", productSchema);

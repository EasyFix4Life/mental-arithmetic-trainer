plugins {
    id("com.android.application")
}

// Release signing stays outside this source tree. The build script supplies the
// four values from a private local keystore; no password is stored in the app.
val signingStore = providers.environmentVariable("MENTAL_ARITHMETIC_KEYSTORE").orNull

android {
    namespace = "local.jeff.mentalarithmetic"
    compileSdk = 37
    buildToolsVersion = "37.0.0"
    testBuildType = "release"

    defaultConfig {
        applicationId = "local.jeff.mentalarithmetic"
        minSdk = 26
        targetSdk = 37
        versionCode = 10101
        versionName = "1.1.1"
        testApplicationId = "local.jeff.mentalarithmetic.test"
        testInstrumentationRunner = "local.jeff.mentalarithmetic.AndroidTestRunner"
    }

    if (signingStore != null) {
        signingConfigs {
            create("localRelease") {
                storeFile = file(signingStore)
                storeType = "PKCS12"
                storePassword = providers.environmentVariable("MENTAL_ARITHMETIC_STORE_PASSWORD").get()
                keyAlias = providers.environmentVariable("MENTAL_ARITHMETIC_KEY_ALIAS").get()
                keyPassword = providers.environmentVariable("MENTAL_ARITHMETIC_KEY_PASSWORD").get()
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            if (signingStore != null) signingConfig = signingConfigs.getByName("localRelease")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        buildConfig = false
    }

    sourceSets.getByName("main").assets.srcDir(layout.buildDirectory.dir("generated/frontendAssets").get().asFile)
}

// Copy Vite's actual production output at build time; Android and desktop use
// the same lesson, random-example and practice code without a second copy.
val bundleWebAssets by tasks.registering(Sync::class) {
    val productionDirectory = rootProject.file("../dist")
    from(productionDirectory)
    into(layout.buildDirectory.dir("generated/frontendAssets/www"))
    exclude(".*", "**/.*")
    doFirst {
        if (!productionDirectory.resolve("index.html").isFile) {
            throw GradleException("Production frontend is missing. Run npm run build in the project folder first.")
        }
    }
}

tasks.named("preBuild").configure {
    dependsOn(bundleWebAssets)
}

import * as React from "react"
import { View } from "react-native"
import { useForm } from "react-hook-form"
import { FormInput } from "@/components/form/FormInput"
import { Button } from "@/components/reusables/Button"
import { MText } from "@/components/reusables/MText"
import Logo from "@/components/Logo"
import { Stack, useRouter } from "expo-router"
import { apiLogin } from "@/lib/auth/api"
import { authAtom, tokenAtom } from "@/lib/auth/state"
import { useAtom, useSetAtom } from "jotai"
import { useMutation, useQuery } from "@tanstack/react-query"
import { ErrorText } from "@/components/ui/ErrorText"
import { Spinner } from "@/components/ui/Spinner"
import { useEffect } from "react"
import MRootView from "@/components/ui/MRootView"
type LoginFormData = {
  mail: string
  password: string
}

export default function LoginScreen() {
  const router = useRouter()

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      mail: "",
      password: "",
    },
  })

  const [token, setToken] = useAtom(tokenAtom)
  const [auth, setAuth] = useAtom(authAtom)
  const mutation = useMutation({
    mutationFn: (data: LoginFormData) => apiLogin(data.mail, data.password),
    onSuccess: data => {
      setAuth({
        isAuthenticated: data.success,
        isLoading: false,
        user: { id: data.userId, mail: data.mail },
        error: data.errorMessage,
        enckey: data.enckey ?? null,
      })

      setToken(data.token)
    },
  })

  useEffect(() => {
    if (auth.isAuthenticated) {
      console.log("redirect to home")
      router.replace("/")
    }
  }, [auth.isAuthenticated])

  async function onSubmit(data: LoginFormData) {
    mutation.mutate(data)
  }

  return (
    <MRootView>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View className="">
        <View className="mb-8">
          <View className="items-center mb-4">
            <Logo width={128} height={128} />
          </View>
          <MText className="text-xl text-muted-foreground text-center">
            Enter your credentials to sign in.
          </MText>
        </View>

        <View className="mb-8">
          <FormInput
            control={control}
            name="mail"
            label="Email"
            placeholder="Enter your email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            rules={{
              required: "Email is required",
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: "Please enter a valid email",
              },
            }}
            error={errors.mail?.message}
          />

          <FormInput
            control={control}
            name="password"
            label="Password"
            placeholder="Enter your password"
            secureTextEntry
            rules={{
              required: "Password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters",
              },
            }}
            error={errors.password?.message}
          />
          {auth.error && <ErrorText>{auth.error}</ErrorText>}
        </View>

        <Button size="lg" onPress={handleSubmit(onSubmit)}>
          {!mutation.isPending && <MText>Sign In</MText>}
          {mutation.isPending && <Spinner />}
        </Button>
      </View>
    </MRootView>
  )
}
